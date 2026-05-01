// stage rendering
import { stages } from "./data/stages.js";
import { renderStage } from "./render/renderStage.js";
// character rendering
import { loadCharacterIndex, renderCharacter, renderStaticCombatant, renderUnit } from "./render/renderChar.js";
// ui rendering
import {
    createPlayerHUD,
    createEnemyHUD
} from "./ui/hud/index.js";
import { createActionMenu } from "./ui/actionMenu/index.js";
import { createAssists } from "./ui/assists/Assists.js";
import { createComboMeter } from "./ui/combo/Combo.js";
import { createActionTimer } from "./ui/actionTimer/ActionTimer.js";
import { buildActionMenuData, resolvePlayerAction } from "./game/charAbilities.js";
import { getConvergenceStageOverride, maybeForceBossSwitch, syncConvergenceState } from "./game/convergence.js";
import { chooseEnemyIntent, evaluateDefenseTiming, getDefenseTimingConfig, resolveEnemyTurn } from "./game/enemyAbilities.js";
import { createBattleState, createEnemyState, resetBattleStats } from "./game/state.js";
import { applyComboChange, getInactiveCharacterIds, getPlayerTurnDuration, healInactiveCharacters, isCharacterUnavailable, resolveDefeatState, tickCooldowns } from "./game/statusEffect.js";
import { playBattleFinishSequence, playCombatFeedback, resetCombatantDefeatState, wait } from "./game/visualFeedback.js";
import { createBattleUI, hideProgressionPanels, playBattleTransition, showBattleSummary, showEnemyActionCallout, showGameOver, showRewardChoices, updateBattleUI } from "./render/renderUI.js";
import { showBattleIntro } from "./render/renderUI.js";
import { enemyAliases, enemies } from "./data/enemies.js";
import { battles } from "./data/battles.js";
import { getRewardsForGrade, rewards as progressionRewards } from "./data/progression.js";

const hudLayer = document.querySelector("#hud-layer");
const actionLayer = document.querySelector("#action-layer");
const battleStage = document.querySelector("#battle-stage");

const enemyRenderScaleById = {
    familiar: 0.74,
    order: 0.82,
    watcher: 0.78,
    pull: 0.9,
    convergence: 1.08
};

async function initBattle() {
    const playerHUD = await createPlayerHUD();
    const enemyHUD = await createEnemyHUD();
    const assists = await createAssists();
    const comboMeter = await createComboMeter();
    const actionTimer = await createActionTimer();
    const actionMenu = await createActionMenu();

    hudLayer.appendChild(playerHUD);
    hudLayer.appendChild(enemyHUD);
    hudLayer.appendChild(assists);
    hudLayer.appendChild(comboMeter);
    battleStage.appendChild(actionTimer);
    actionLayer.appendChild(actionMenu);

    const characterIndex = await loadCharacterIndex();
    const battleState = createBattleState(battles[0].enemies[0]);
    const ui = createBattleUI({
        playerHUD,
        enemyHUD,
        assists,
        comboMeter,
        actionMenu,
        battleStage
    });
    let resolvingTurn = false;
    let renderedPlayerId = null;
    let renderedEnemyId = null;
    let renderedStageKey = null;
    let activeTurnTimer = null;
    let activeDefenseTimer = null;
    let isPaused = false;
    let endSequenceRunning = false;
    const timingKeys = ["W", "A", "S", "D"];
    const timingDebug = document.createElement("div");
    timingDebug.id = "timing-debug";
    timingDebug.className = "hidden";
    battleStage.appendChild(timingDebug);

    function getCurrentBattleConfig() {
        return battles[battleState.run.battleIndex];
    }

    function getCurrentEncounterId() {
        return getCurrentBattleConfig()?.enemies?.[battleState.run.enemyIndex] ?? "familiar";
    }

    function computeBattleSummary() {
        const teamHp = ["girl", "officer", "man"].reduce((sum, id) => sum + battleState.roster[id].hp, 0);
        const teamMaxHp = ["girl", "officer", "man"].reduce((sum, id) => sum + battleState.roster[id].maxHp, 0);
        const hpBonus = Math.round((teamHp / teamMaxHp) * 40);
        const comboBonus = Math.round(battleState.maxComboReached * 12);
        const counterBonus = battleState.stats.counters * 6;
        const penaltyTotal = battleState.stats.penalties * 5 + battleState.stats.timeouts * 4 + battleState.stats.defeats * 8;
        const finalScore = hpBonus + comboBonus + counterBonus - penaltyTotal;

        let grade = "D";
        if (finalScore >= 70) grade = "S";
        else if (finalScore >= 52) grade = "A";
        else if (finalScore >= 38) grade = "B";
        else if (finalScore >= 24) grade = "C";

        return {
            hpBonus,
            comboBonus,
            counterBonus,
            penaltyTotal,
            finalScore,
            grade
        };
    }

    function hydrateEnemy(enemyId) {
        battleState.enemy = createEnemyState(enemyId);
        syncConvergenceState(battleState);
        renderedEnemyId = null;
    }

    function chooseRandomInactiveCharacter() {
        const candidates = getInactiveCharacterIds(battleState)
            .filter((id) => !isCharacterUnavailable(battleState, id));

        if (!candidates.length) return false;

        const nextCharacterId = candidates[Math.floor(Math.random() * candidates.length)];
        if (!nextCharacterId || nextCharacterId === battleState.activeCharacterId) return false;

        battleState.activeCharacterId = nextCharacterId;
        renderedPlayerId = null;
        renderedStageKey = null;
        return true;
    }

    function prepareEncounter() {
        battleState.battleOver = false;
        battleState.outcome = null;
        battleState.currentDefense = null;
        battleState.activeTimingResult = null;
        hydrateEnemy(getCurrentEncounterId());
        resetCombatantDefeatState("enemy-slot");
        battleState.enemyIntent = chooseEnemyIntent(battleState);
        hideProgressionPanels(ui);
        syncBattleUI();
        syncPauseUI();
        updateMenuLock();
    }

    async function startCurrentEncounter({ resetStats: shouldResetStats = false, withTransition = false, randomizeActiveCharacter = false } = {}) {
        if (shouldResetStats) {
            resetBattleStats(battleState);
        }

        if (withTransition) {
            await playBattleTransition(ui, {
                fadeOutMs: 500,
                holdMs: 1000,
                fadeInMs: 500,
                onBlackout: () => {
                    if (randomizeActiveCharacter) {
                        chooseRandomInactiveCharacter();
                    }
                    prepareEncounter();
                }
            });
        } else {
            prepareEncounter();
        }
        const battleConfig = getCurrentBattleConfig();
        const waveCount = battleConfig?.enemies?.length ?? 1;
        const waveLabel = waveCount > 1 ? `Wave ${battleState.run.enemyIndex + 1}` : battleState.enemy.name;
        await showBattleIntro(ui, {
            title: "Battle Start",
            subtitle: `${battleConfig?.label ?? "Battle"} • ${waveLabel}`,
            variant: "battle-start"
        });
        startPlayerTurnTimer();
    }

    function applyRewardById(rewardId) {
        const reward = progressionRewards.find((entry) => entry.id === rewardId);
        if (!reward) return;
        reward.effect(battleState);
        battleState.run.rewards.push(reward.id);
    }

    async function advanceToNextBattle() {
        battleState.run.completedBattles += 1;
        battleState.run.battleIndex += 1;
        battleState.run.enemyIndex = 0;
        await wait(1000);
        await startCurrentEncounter({ resetStats: true, withTransition: true, randomizeActiveCharacter: true });
    }

    async function continueAfterVictory() {
        const currentBattle = getCurrentBattleConfig();
        const hasMoreEnemiesInBattle = battleState.run.enemyIndex < currentBattle.enemies.length - 1;

        if (hasMoreEnemiesInBattle) {
            battleState.run.enemyIndex += 1;
            await startCurrentEncounter({ resetStats: false, withTransition: true });
            return;
        }

        const summary = computeBattleSummary();
        const hasMoreBattles = battleState.run.battleIndex < battles.length - 1;
        const rewardChoices = hasMoreBattles ? getRewardsForGrade(summary.grade) : [];

        showBattleSummary(ui, summary);
        showRewardChoices(ui, rewardChoices, {
            finalBattle: !hasMoreBattles,
            onSelect: (rewardId) => {
                if (rewardId && rewardId !== "continue") {
                    applyRewardById(rewardId);
                }

                if (hasMoreBattles) {
                    void advanceToNextBattle();
                } else {
                    battleState.run.completedBattles += 1;
                    hideProgressionPanels(ui);
                    showGameOver(ui, "victory");
                }
            }
        });
    }

    function renderActiveCharacter() {
        if (!battleState.activeCharacterId) return;
        if (renderedPlayerId === battleState.activeCharacterId) return;

        renderedPlayerId = battleState.activeCharacterId;

        if (battleState.activeCharacterId === "girl") {
            renderUnit(characterIndex, "girl_tiger", "idle", "player-slot", "player");
            return;
        }

        renderCharacter(characterIndex, battleState.activeCharacterId, "idle", "player-slot", "player");
    }

    function renderEnemy() {
        if (!battleState.enemy.id) return;
        if (renderedEnemyId === battleState.enemy.id) return;

        renderedEnemyId = battleState.enemy.id;
        const enemyTemplate = enemies[enemyAliases[battleState.enemy.id] ?? battleState.enemy.id] ?? enemies.familiar;
        renderStaticCombatant(enemyTemplate.spritePath, "enemy-slot", "enemy", {
            scale: enemyRenderScaleById[enemyTemplate.id] ?? 0.8
        });
    }

    function getStageForCharacter(characterId) {
        const bossStageOverride = getConvergenceStageOverride(battleState);
        if (bossStageOverride && stages[bossStageOverride]) {
            return { key: bossStageOverride, config: stages[bossStageOverride] };
        }

        if (characterId === "girl") return { key: "paradise", config: stages.paradise };
        if (characterId === "officer") return { key: "taipei", config: stages.taipei };
        if (characterId === "man") return { key: "nola", config: stages.nola };
        return { key: "paradise", config: stages.paradise };
    }

    function renderActiveStage() {
        const { key, config } = getStageForCharacter(battleState.activeCharacterId);
        if (!config) return;

        const animate = renderedStageKey !== null && renderedStageKey !== key;
        renderedStageKey = key;
        renderStage(config, { animate });
    }

    function syncBattleUI() {
        syncConvergenceState(battleState);
        renderActiveStage();
        renderActiveCharacter();
        renderEnemy();
        updateBattleUI(battleState, ui, buildActionMenuData(battleState));
    }

    function setTimingDebug(lines = [], visible = true) {
        timingDebug.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
        timingDebug.classList.toggle("hidden", !visible);
    }

    function syncPauseUI() {
        ui.pauseOverlay.classList.toggle("hidden", !isPaused);
        ui.pauseButton.textContent = isPaused ? "Resume" : "Pause";
    }

    function updateMenuLock() {
        ui.actionMenu.setLocked(isPaused || resolvingTurn || battleState.battleOver);
    }

    function stopTurnTimer() {
        if (!activeTurnTimer) return null;

        const snapshot = activeTurnTimer.stop();
        activeTurnTimer = null;
        return snapshot;
    }

    function startPlayerTurnTimer(initialRemainingMs = null) {
        stopTurnTimer();

        const durationMs = getPlayerTurnDuration(battleState);
        battleState.playerTurnScale = 1;
        let remainingMs = initialRemainingMs ?? durationMs;
        let startTime = performance.now();
        let rafId = null;
        let settled = false;
        let paused = false;

        function tick(now) {
            if (settled || paused) return;

            const elapsed = now - startTime;
            const liveRemainingMs = Math.max(0, remainingMs - elapsed);
            ui.actionMenu.setTurnTimer({ durationMs, remainingMs: liveRemainingMs, visible: true });

            if (liveRemainingMs <= 0) {
                settled = true;
                ui.actionMenu.setTurnTimer({ durationMs, remainingMs: 0, visible: true });
                activeTurnTimer = null;
                window.setTimeout(() => handlePlayerTimeout(), 0);
                return;
            }

            rafId = window.requestAnimationFrame(tick);
        }

        activeTurnTimer = {
            pause() {
                if (settled || paused) return remainingMs;
                paused = true;
                if (rafId) window.cancelAnimationFrame(rafId);
                remainingMs = Math.max(0, remainingMs - (performance.now() - startTime));
                ui.actionMenu.setTurnTimer({ durationMs, remainingMs, visible: true });
                return remainingMs;
            },
            resume() {
                if (settled || !paused) return;
                paused = false;
                startTime = performance.now();
                rafId = window.requestAnimationFrame(tick);
            },
            stop() {
                if (settled) return null;
                settled = true;
                if (rafId) window.cancelAnimationFrame(rafId);
                const liveRemainingMs = paused
                    ? remainingMs
                    : Math.max(0, remainingMs - (performance.now() - startTime));
                return {
                    durationMs,
                    remainingMs: liveRemainingMs,
                    isFast: liveRemainingMs >= durationMs / 2
                };
            }
        };

        ui.actionMenu.setTurnTimer({ durationMs, remainingMs, visible: true });
        if (!isPaused) {
            rafId = window.requestAnimationFrame(tick);
        } else {
            paused = true;
        }
    }

    function getRandomTimingKey() {
        return timingKeys[Math.floor(Math.random() * timingKeys.length)];
    }

    async function runDefenseTimingChallenge() {
        const config = getDefenseTimingConfig(battleState, battleState.enemyIntent);
        if (!config) return null;

        return await new Promise((resolve) => {
            const durationMs = config.durationMs;
            let remainingMs = durationMs;
            let startTime = performance.now();
            const expectedKey = getRandomTimingKey();
            let rafId = null;
            let settled = false;
            let paused = false;
            let lastPressedKey = null;
            let displayedRemainingRatio = 1;

            setTimingDebug([
                `Defense: ${battleState.currentDefense}`,
                `Prompt: ${expectedKey}`,
                `Window: ${((config.goodWindowStart ?? 0) * 100).toFixed(0)}-${((config.goodWindowEnd ?? 0) * 100).toFixed(0)}`,
                `Perfect: ${config.perfectWindowStart !== undefined ? `${(config.perfectWindowStart * 100).toFixed(0)}-${(config.perfectWindowEnd * 100).toFixed(0)}` : "--"}`
            ]);

            function finish(pressed = false, matched = false) {
                if (settled) return;
                settled = true;
                if (rafId) window.cancelAnimationFrame(rafId);
                activeDefenseTimer = null;

                const elapsedMs = Math.min(durationMs, durationMs - remainingMs + (paused ? 0 : (performance.now() - startTime)));
                const elapsedRatio = Math.max(0, Math.min(1, elapsedMs / durationMs));
                const exactRemainingRatio = Math.max(0, Math.min(1, 1 - elapsedRatio));
                const remainingRatio = pressed ? displayedRemainingRatio : exactRemainingRatio;

                window.removeEventListener("keydown", handleKeydown);
                actionTimer.setState({ visible: false, keyLabel: "" });
                resolve({
                    clicked: pressed && matched,
                    attempted: pressed,
                    matched,
                    pressedKey: lastPressedKey,
                    elapsedMs,
                    elapsedRatio,
                    remainingRatio,
                    expectedKey
                });
            }

            function handleKeydown(event) {
                if (isPaused) return;
                if (event.repeat) return;
                const pressedKey = event.key.toUpperCase();
                if (!["W", "A", "S", "D"].includes(pressedKey)) return;
                lastPressedKey = pressedKey;
                if (pressedKey !== expectedKey) {
                    actionTimer.pulseWrong?.();
                    setTimingDebug([
                        `Defense: ${battleState.currentDefense}`,
                        `Prompt: ${expectedKey}`,
                        `Pressed: ${pressedKey} (wrong)`,
                        `Cursor: ${(displayedRemainingRatio * 100).toFixed(1)}`
                    ]);
                    return;
                }
                finish(true, true);
            }

            function tick(now) {
                if (settled || paused) return;

                const elapsed = now - startTime;
                const liveRemainingMs = Math.max(0, remainingMs - elapsed);
                const remainingRatio = Math.max(0, Math.min(1, liveRemainingMs / durationMs));
                displayedRemainingRatio = remainingRatio;

                actionTimer.setState({
                    durationMs,
                    remainingMs: liveRemainingMs,
                    visible: true,
                    armed: true,
                    keyLabel: expectedKey,
                    windowStart: config.goodWindowStart ?? null,
                    windowEnd: config.goodWindowEnd ?? null,
                    perfectStart: config.perfectWindowStart ?? null,
                    perfectEnd: config.perfectWindowEnd ?? null
                });

                setTimingDebug([
                    `Defense: ${battleState.currentDefense}`,
                    `Prompt: ${expectedKey}`,
                    `Cursor: ${(remainingRatio * 100).toFixed(1)}`,
                    `Window: ${((config.goodWindowStart ?? 0) * 100).toFixed(0)}-${((config.goodWindowEnd ?? 0) * 100).toFixed(0)}`,
                    `Perfect: ${config.perfectWindowStart !== undefined ? `${(config.perfectWindowStart * 100).toFixed(0)}-${(config.perfectWindowEnd * 100).toFixed(0)}` : "--"}`
                ]);

                if (liveRemainingMs <= 0) {
                    remainingMs = 0;
                    finish(false, false);
                    return;
                }

                rafId = window.requestAnimationFrame(tick);
            }

            activeDefenseTimer = {
                pause() {
                    if (settled || paused) return remainingMs;
                    paused = true;
                    if (rafId) window.cancelAnimationFrame(rafId);
                    remainingMs = Math.max(0, remainingMs - (performance.now() - startTime));
                    actionTimer.setState({
                        durationMs,
                        remainingMs,
                        visible: true,
                        armed: true,
                        keyLabel: expectedKey,
                        windowStart: config.goodWindowStart ?? null,
                        windowEnd: config.goodWindowEnd ?? null,
                        perfectStart: config.perfectWindowStart ?? null,
                        perfectEnd: config.perfectWindowEnd ?? null
                    });
                    return remainingMs;
                },
                resume() {
                    if (settled || !paused) return;
                    paused = false;
                    startTime = performance.now();
                    rafId = window.requestAnimationFrame(tick);
                },
                cancel() {
                    finish(false, false);
                }
            };

            window.addEventListener("keydown", handleKeydown);
            if (!isPaused) {
                rafId = window.requestAnimationFrame(tick);
            } else {
                paused = true;
            }
        });
    }

    function togglePause() {
        if (battleState.battleOver) return;

        isPaused = !isPaused;
        syncPauseUI();

        if (isPaused) {
            activeTurnTimer?.pause?.();
            activeDefenseTimer?.pause?.();
        } else {
            activeTurnTimer?.resume?.();
            activeDefenseTimer?.resume?.();
        }

        updateMenuLock();
    }

    async function finishBattleIfNeeded() {
        resolveDefeatState(battleState);

        if (!battleState.battleOver) return false;
        if (endSequenceRunning) return true;
        endSequenceRunning = true;

        stopTurnTimer();
        ui.actionMenu.setTurnTimer({ durationMs: getPlayerTurnDuration(battleState), remainingMs: 0, visible: true });
        actionTimer.setState({ visible: false });
        updateMenuLock();
        const outcome = battleState.outcome;
        await playBattleFinishSequence(outcome);
        await showBattleIntro(ui, {
            title: outcome === "victory" ? "Victory" : "Defeat",
            subtitle: "",
            variant: "battle-end",
            phaseLabel: "Battle End"
        });
        endSequenceRunning = false;
        if (outcome === "victory") {
            await continueAfterVictory();
        } else {
            showGameOver(ui, outcome);
        }
        return true;
    }

    async function endRoundAndResume() {

        resolveDefeatState(battleState);
        const phaseChanged = syncConvergenceState(battleState);
        const healed = healInactiveCharacters(battleState);
        tickCooldowns(battleState);

        if (healed.length) {
            await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: "Bench Regen" }]);
        }

        if (await finishBattleIfNeeded()) {
            resolvingTurn = false;
            return;
        }

        if (phaseChanged && battleState.enemy.id === "convergence" && battleState.enemy.phase === 3) {
            syncBattleUI();
            await playCombatFeedback([{ kind: "text", slotId: "enemy-slot", label: "Convergence Arena" }]);
        }

        battleState.enemyIntent = chooseEnemyIntent(battleState);
        syncBattleUI();
        resolvingTurn = false;
        updateMenuLock();
        startPlayerTurnTimer();
    }

    async function runEnemyPhase() {
        await wait(420);

        if (battleState.enemyIntent?.label) {
            await showEnemyActionCallout(ui, battleState.enemyIntent.label, 760);
            await wait(180);
        }

        let timingResult = null;
        if (battleState.currentDefense) {
            const counterInvalid = battleState.currentDefense === "counter"
                && (battleState.enemyIntent?.range !== "close" || !battleState.enemyIntent?.counterable);
            const dodgeInvalid = battleState.currentDefense === "dodge"
                && battleState.enemyIntent?.type === "status";

            if (counterInvalid || dodgeInvalid) {
                battleState.activeTimingResult = {
                    defense: battleState.currentDefense,
                    outcome: "invalid",
                    success: false
                };

                setTimingDebug([
                    `Defense: ${battleState.currentDefense}`,
                    `Prompt: --`,
                    `Pressed: --`,
                    `Cursor: --`,
                    `Result: invalid`
                ]);
                window.setTimeout(() => setTimingDebug([], false), 2200);
            } else {
                timingResult = await runDefenseTimingChallenge();
                battleState.activeTimingResult = evaluateDefenseTiming(battleState, battleState.enemyIntent, timingResult);
                setTimingDebug([
                    `Defense: ${battleState.currentDefense}`,
                    `Prompt: ${timingResult?.expectedKey ?? "-"}`,
                    `Pressed: ${timingResult?.pressedKey ?? "-"}`,
                    `Cursor: ${((timingResult?.remainingRatio ?? 0) * 100).toFixed(1)}`,
                    `Result: ${battleState.activeTimingResult?.outcome ?? "none"}`
                ]);
                window.setTimeout(() => setTimingDebug([], false), 2200);
            }
        } else {
            battleState.activeTimingResult = null;
            setTimingDebug([], false);
        }

        const enemyResult = resolveEnemyTurn(battleState, battleState.activeTimingResult);
        syncBattleUI();
        await playCombatFeedback(enemyResult.feedback);

        const forcedSwitch = maybeForceBossSwitch(battleState);
        if (forcedSwitch) {
            renderedPlayerId = null;
            syncBattleUI();
            await playCombatFeedback([
                {
                    kind: "text",
                    slotId: "player-slot",
                    label: `Forced Switch: ${forcedSwitch.to[0].toUpperCase()}${forcedSwitch.to.slice(1)}`
                }
            ]);
        }

        await endRoundAndResume();
    }

    async function handlePlayerTimeout() {
        if (resolvingTurn || battleState.battleOver) return;

        resolvingTurn = true;
        updateMenuLock();
        battleState.stats.timeouts += 1;
        applyComboChange(battleState, -0.5);
        battleState.currentDefense = null;
        battleState.activeTimingResult = null;

        syncBattleUI();
        await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: "Time Out" }]);

        if (await finishBattleIfNeeded()) {
            resolvingTurn = false;
            return;
        }

        await runEnemyPhase();
    }

    async function runBattleExchange(item, timingSnapshot) {
        resolvingTurn = true;
        updateMenuLock();

        if (timingSnapshot?.isFast) {
            applyComboChange(battleState, 0.25);
            battleState.stats.fastActions += 1;
        }

        const playerResult = resolvePlayerAction(battleState, item);
        syncBattleUI();
        await playCombatFeedback(playerResult.feedback);
        await wait(260);

        if (timingSnapshot?.isFast) {
            await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: "Fast Action +0.25" }]);
            await wait(160);
        }

        if (await finishBattleIfNeeded()) {
            resolvingTurn = false;
            return;
        }

        await runEnemyPhase();
    }

    await startCurrentEncounter({ resetStats: true, withTransition: false });

    actionMenu.addEventListener("actionselected", async (event) => {
        if (isPaused || resolvingTurn || battleState.battleOver) return;
        const timingSnapshot = stopTurnTimer();
        await runBattleExchange(event.detail.item, timingSnapshot);
    });

    ui.pauseButton.addEventListener("click", () => {
        togglePause();
    });

    window.addEventListener("keydown", (event) => {
        if (event.repeat) return;
        if (event.key === "Escape") {
            event.preventDefault();
            togglePause();
        }
    });
}

initBattle();
