// stage rendering
import { loadStages } from "./data/stages.js";
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
import { advanceMeltdown, applyComboChange, getInactiveCharacterIds, getPlayerTurnDuration, healInactiveCharacters, isCharacterUnavailable, resolveDefeatState, tickCooldowns } from "./game/statusEffect.js";
import { playBattleFinishSequence, playCombatFeedback, resetCombatantDefeatState, wait } from "./game/visualFeedback.js";
import { createBattleUI, hideProgressionPanels, playBattleTransition, showBattleSummary, showEnemyActionCallout, showGameOver, showRewardChoices, showRunResults, updateBattleUI } from "./render/renderUI.js";
import { showBattleIntro } from "./render/renderUI.js";
import { enemyAliases, enemies } from "./data/enemies.js";
import { battles } from "./data/battles.js";
import { getRewardsForGrade, rewards as progressionRewards } from "./data/progression.js";
import { characterVariants, stageVariants } from "./data/gallery.js";
import { getLanguage, setLanguage, t } from "./i18n.js";
import { playSpriteAnimation } from "./render/animations.js";

const hudLayer = document.querySelector("#hud-layer");
const actionLayer = document.querySelector("#action-layer");
const battleStage = document.querySelector("#battle-stage");
const mainMenu = document.querySelector("#main-menu");
const battleUi = document.querySelector("#battle-ui");

const enemyRenderScaleById = {
    familiar: 0.74,
    order: 0.82,
    watcher: 0.78,
    pull: 0.9,
    convergence: 1.08
};

let battleInitPromise = null;

async function initBattle() {
    const stages = await loadStages();
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
    let wasMeltdownActive = battleState.meltdown?.active ?? false;
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
        const hpBonus = Math.round((teamHp / teamMaxHp) * 30);
        const comboBonus = Math.round((battleState.maxComboReached / 3) * 20);
        const counterBonus = (battleState.stats.perfectCounters * 2) + battleState.stats.goodCounters;
        const fastBonus = battleState.stats.fastActions;
        const penaltyTotal =
            battleState.stats.heavyDamage +
            (battleState.stats.failedCounters * 2) +
            (battleState.stats.timeouts * 5) +
            (battleState.stats.defeats * 10);
        const finalScore = 100 + hpBonus + comboBonus + counterBonus + fastBonus - penaltyTotal;

        let grade = "D";
        if (finalScore >= 130) grade = "S";
        else if (finalScore >= 110) grade = "A";
        else if (finalScore >= 90) grade = "B";
        else if (finalScore >= 70) grade = "C";

        return {
            hpBonus,
            comboBonus,
            counterBonus,
            fastBonus,
            penaltyTotal,
            finalScore,
            grade
        };
    }

    function computeRunSummary() {
        const totals = battleState.run.battleSummaries.reduce((acc, summary) => {
            acc.hpBonus += summary.hpBonus;
            acc.comboBonus += summary.comboBonus;
            acc.counterBonus += summary.counterBonus;
            acc.fastBonus += summary.fastBonus;
            acc.penaltyTotal += summary.penaltyTotal;
            acc.finalScore += summary.finalScore;
            return acc;
        }, {
            hpBonus: 0,
            comboBonus: 0,
            counterBonus: 0,
            fastBonus: 0,
            penaltyTotal: 0,
            finalScore: 0
        });

        const battleCount = Math.max(1, battleState.run.battleSummaries.length);
        const averageScore = totals.finalScore / battleCount;
        let grade = "D";
        if (averageScore >= 130) grade = "S";
        else if (averageScore >= 110) grade = "A";
        else if (averageScore >= 90) grade = "B";
        else if (averageScore >= 70) grade = "C";

        return {
            ...totals,
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

    function chooseRandomAvailableCharacter() {
        const candidates = ["girl", "officer", "man"].filter((id) => !isCharacterUnavailable(battleState, id));
        if (!candidates.length) return false;

        battleState.activeCharacterId = candidates[Math.floor(Math.random() * candidates.length)];
        renderedPlayerId = null;
        renderedStageKey = null;
        return true;
    }

    function prepareEncounter() {
        battleState.battleOver = false;
        battleState.outcome = null;
        battleState.currentDefense = null;
        battleState.activeTimingResult = null;
        wasMeltdownActive = battleState.meltdown?.active ?? false;
        hydrateEnemy(getCurrentEncounterId());
        resetCombatantDefeatState("enemy-slot");
        battleState.enemyIntent = chooseEnemyIntent(battleState);
        hideProgressionPanels(ui);
        syncBattleUI();
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
        const battleLabel = battleState.run.battleIndex === battles.length - 1
            ? t("ui.finalBoss")
            : `${t("ui.battle")} ${battleState.run.battleIndex + 1}`;
        const waveLabel = waveCount > 1
            ? `${t("ui.wave")} ${battleState.run.enemyIndex + 1}`
            : t(`enemy.${battleState.enemy.id}.name`, battleState.enemy.name);
        await showBattleIntro(ui, {
            title: t("ui.battleStart"),
            subtitle: `${battleLabel} • ${waveLabel}`,
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
        battleState.run.battleSummaries.push(summary);
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
                    showRunResults(ui, computeRunSummary(), {
                        onReturn: () => {
                            window.location.reload();
                        }
                    });
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
                title: outcome === "victory" ? t("ui.victory") : t("ui.defeat"),
                subtitle: "",
                variant: "battle-end",
                phaseLabel: t("ui.battleEnd")
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
        const meltdownJustTriggered = !wasMeltdownActive && (battleState.meltdown?.active ?? false);
        wasMeltdownActive = battleState.meltdown?.active ?? false;
        const phaseChanged = syncConvergenceState(battleState);
        const healed = healInactiveCharacters(battleState);
        tickCooldowns(battleState);
        const meltdownEnded = meltdownJustTriggered ? false : advanceMeltdown(battleState);
        if (meltdownEnded) {
            wasMeltdownActive = false;
        }

        if (healed.length) {
            await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: t("feedback.benchRegen") }]);
        }

        if (meltdownJustTriggered) {
            syncBattleUI();
            await showBattleIntro(ui, {
                title: t("ui.girlInactive"),
                subtitle: "",
                variant: "meltdown",
                phaseLabel: t("ui.meltdown")
            });
        }

        if (await finishBattleIfNeeded()) {
            resolvingTurn = false;
            return;
        }

        if (phaseChanged && battleState.enemy.id === "convergence" && battleState.enemy.phase === 3) {
            syncBattleUI();
            await playCombatFeedback([{ kind: "text", slotId: "enemy-slot", label: t("feedback.convergenceArena") }]);
        }

        if (meltdownEnded) {
            syncBattleUI();
            await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: t("feedback.meltdownSettled") }]);
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
            await showEnemyActionCallout(ui, t(`enemyAbility.${battleState.enemyIntent.id}.label`, battleState.enemyIntent.label), 760);
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
                    label: t("feedback.forcedSwitch", `Forced Switch: ${forcedSwitch.to}`, {
                        name: t(`character.${forcedSwitch.to}`, forcedSwitch.to)
                    })
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
        await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: t("feedback.timeOut") }]);

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

        if (battleState.enemy.hp <= 0) {
            applyComboChange(battleState, 1);
        }

        if (timingSnapshot?.isFast) {
            await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: t("feedback.fastActionBonus") }]);
            await wait(160);
        }

        if (await finishBattleIfNeeded()) {
            resolvingTurn = false;
            return;
        }

        await runEnemyPhase();
    }

    chooseRandomAvailableCharacter();
    await startCurrentEncounter({ resetStats: true, withTransition: false });

    actionMenu.addEventListener("actionselected", async (event) => {
        if (isPaused || resolvingTurn || battleState.battleOver) return;
        const timingSnapshot = stopTurnTimer();
        await runBattleExchange(event.detail.item, timingSnapshot);
    });

}

function createGalleryCard({ title, subtitle = "", className = "", preview = null }) {
    const card = document.createElement("article");
    card.className = `gallery-card ${className}`.trim();
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${title}`);

    if (preview) {
        card.galleryPreview = { title, subtitle, ...preview };
    }

    const media = document.createElement("div");
    media.className = "gallery-card-media";

    const label = document.createElement("div");
    label.className = "gallery-card-label";
    label.innerHTML = `<strong>${title}</strong>${subtitle ? `<span>${subtitle}</span>` : ""}`;

    card.append(media, label);
    return { card, media };
}

function createAnimatedGallerySprite(animation) {
    const sprite = document.createElement("div");
    sprite.className = "gallery-sprite";
    sprite.style.backgroundImage = `url("${animation.src}")`;
    sprite.style.backgroundRepeat = "no-repeat";
    playSpriteAnimation(sprite, animation, { loop: true });
    return sprite;
}

function createGalleryImage(src, alt) {
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";
    return image;
}

function renderGalleryTab(tab, grid, data) {
    const fragment = document.createDocumentFragment();

    if (tab === "characters") {
        Object.entries(data.characterIndex.characters).forEach(([id, character]) => {
            const animation = character.animations.idle;
            const { card, media } = createGalleryCard({
                title: character.name,
                subtitle: id,
                className: "gallery-card--sprite",
                preview: {
                    type: "animation",
                    animation
                }
            });

            media.appendChild(createAnimatedGallerySprite(animation));
            fragment.appendChild(card);
        });
        grid.replaceChildren(fragment);
        return;
    }

    if (tab === "variants") {
        characterVariants.forEach((variant) => {
            const { card, media } = createGalleryCard({
                title: variant.name,
                subtitle: variant.characterId,
                preview: {
                    type: "image",
                    src: variant.src,
                    alt: variant.name
                }
            });
            media.appendChild(createGalleryImage(variant.src, variant.name));
            fragment.appendChild(card);
        });
        grid.replaceChildren(fragment);
        return;
    }

    if (tab === "enemies") {
        Object.values(enemies).forEach((enemy) => {
            const { card, media } = createGalleryCard({
                title: enemy.name,
                subtitle: enemy.id,
                className: "gallery-card--sprite",
                preview: {
                    type: "image",
                    src: enemy.spritePath,
                    alt: enemy.name
                }
            });
            media.appendChild(createGalleryImage(enemy.spritePath, enemy.name));
            fragment.appendChild(card);
        });
        grid.replaceChildren(fragment);
        return;
    }

    if (tab === "stages") {
        Object.entries(data.stages).forEach(([id, stage]) => {
            const { card, media } = createGalleryCard({
                title: stage.name,
                subtitle: `${id} battle stage`,
                className: "gallery-card--stage",
                preview: {
                    type: "stage",
                    src: stage.layers.ground,
                    backgroundSrc: stage.layers.far,
                    alt: stage.name
                }
            });
            if (stage.layers.far) {
                media.style.backgroundImage = `url("${stage.layers.far}")`;
            }
            media.appendChild(createGalleryImage(stage.layers.ground, stage.name));
            fragment.appendChild(card);
        });

        stageVariants.forEach((stage) => {
            const { card, media } = createGalleryCard({
                title: stage.name,
                subtitle: `${stage.stageId} variant`,
                className: "gallery-card--stage",
                preview: {
                    type: "image",
                    src: stage.src,
                    alt: stage.name
                }
            });
            media.appendChild(createGalleryImage(stage.src, stage.name));
            fragment.appendChild(card);
        });
        grid.replaceChildren(fragment);
    }
}

function setupMainMenu() {
    const menuItems = [...document.querySelectorAll(".main-menu-item")];
    const menuCards = {
        options: document.querySelector("#main-menu-options"),
        credits: document.querySelector("#main-menu-credits"),
        exit: document.querySelector("#main-menu-exit")
    };
    const galleryPanel = document.querySelector("#main-menu-gallery");
    const galleryClose = document.querySelector("#gallery-close");
    const galleryGrid = document.querySelector("#gallery-grid");
    const galleryTabs = [...document.querySelectorAll(".gallery-tab")];
    const galleryLightbox = document.querySelector("#gallery-lightbox");
    const galleryLightboxClose = document.querySelector("#gallery-lightbox-close");
    const galleryLightboxMedia = document.querySelector("#gallery-lightbox-media");
    const galleryLightboxTitle = document.querySelector("#gallery-lightbox-title");
    const galleryLightboxSubtitle = document.querySelector("#gallery-lightbox-subtitle");
    const galleryZoomOut = document.querySelector("#gallery-zoom-out");
    const galleryZoomReset = document.querySelector("#gallery-zoom-reset");
    const galleryZoomIn = document.querySelector("#gallery-zoom-in");
    const tutorialPanel = document.querySelector("#main-menu-tutorial");
    const tutorialClose = document.querySelector("#tutorial-close");
    const tutorialTabs = [...document.querySelectorAll(".tutorial-tab")];
    const tutorialPanels = [...document.querySelectorAll(".tutorial-panel")];
    const languageOptions = [...document.querySelectorAll(".language-option")];
    const localizedNodes = [...document.querySelectorAll("[data-i18n]")];
    let galleryDataPromise = null;
    const galleryTabPanels = new Map();
    let activeGalleryTab = "characters";
    let galleryZoom = 1;

    function setActiveMenuItem(action) {
        for (const item of menuItems) {
            const isActive = item.dataset.menuAction === action;
            item.classList.toggle("is-active", isActive && !item.disabled);
        }
    }

    function hideMenuCards() {
        Object.entries(menuCards).forEach(([key, node]) => {
            node?.classList.add("hidden");
        });
    }

    function showMenuCard(cardKey = null, activeAction = cardKey) {
        Object.entries(menuCards).forEach(([key, node]) => {
            node?.classList.toggle("hidden", key !== cardKey);
        });
        setActiveMenuItem(activeAction);
    }

    function previewMenuAction(action) {
        if (action === "gallery" || action === "tutorial") {
            hideMenuCards();
            setActiveMenuItem(action);
            return;
        }

        if (action === "options" || action === "credits" || action === "exit") {
            showMenuCard(action, action);
            return;
        }

        showMenuCard(null, action);
    }

    async function getGalleryData() {
        if (!galleryDataPromise) {
            galleryDataPromise = Promise.all([loadCharacterIndex(), loadStages()])
                .then(([characterIndex, stages]) => ({ characterIndex, stages }));
        }
        return galleryDataPromise;
    }

    function showCachedGalleryTab(tab, data) {
        galleryTabPanels.forEach((panel, panelTab) => {
            panel.classList.toggle("hidden", panelTab !== tab);
        });

        let panel = galleryTabPanels.get(tab);
        if (!panel) {
            panel = document.createElement("div");
            panel.className = "gallery-grid-panel";
            panel.dataset.galleryPanel = tab;
            renderGalleryTab(tab, panel, data);
            galleryTabPanels.set(tab, panel);
            galleryGrid.appendChild(panel);
        }

        panel.classList.remove("hidden");
    }

    async function showGallery(tab = activeGalleryTab) {
        activeGalleryTab = tab;
        galleryPanel.classList.remove("hidden");
        hideTutorial();
        hideMenuCards();
        setActiveMenuItem("gallery");
        galleryTabs.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.galleryTab === activeGalleryTab);
        });

        if (!galleryTabPanels.has(activeGalleryTab)) {
            galleryGrid.innerHTML = `<div class="gallery-loading">Loading...</div>`;
        }

        const data = await getGalleryData();
        if (galleryGrid.querySelector(".gallery-loading")) {
            galleryGrid.innerHTML = "";
        }
        showCachedGalleryTab(activeGalleryTab, data);
    }

    function hideGallery() {
        galleryPanel.classList.add("hidden");
        hideGalleryLightbox();
        setActiveMenuItem("start");
    }

    function showTutorial() {
        tutorialPanel.classList.remove("hidden");
        hideGallery();
        hideMenuCards();
        setActiveMenuItem("tutorial");
    }

    function hideTutorial() {
        tutorialPanel.classList.add("hidden");
    }

    function showTutorialTab(tab) {
        tutorialTabs.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.tutorialTab === tab);
        });
        tutorialPanels.forEach((panel) => {
            panel.classList.toggle("hidden", panel.dataset.tutorialPanel !== tab);
        });
    }

    function showGalleryLightbox(preview) {
        if (!preview) return;

        galleryLightboxMedia.innerHTML = "";
        galleryLightboxMedia.style.backgroundImage = "";
        galleryLightboxMedia.className = `gallery-lightbox-media gallery-lightbox-media--${preview.type}`;
        galleryLightboxTitle.textContent = preview.title;
        galleryLightboxSubtitle.textContent = preview.subtitle ?? "";
        setGalleryZoom(preview.type === "animation" ? 1.5 : 1);

        const content = document.createElement("div");
        content.className = "gallery-lightbox-content";

        if (preview.type === "animation") {
            content.appendChild(createAnimatedGallerySprite(preview.animation));
        } else {
            if (preview.backgroundSrc) {
                galleryLightboxMedia.style.backgroundImage = `url("${preview.backgroundSrc}")`;
            }

            const image = document.createElement("img");
            image.src = preview.src;
            image.alt = preview.alt ?? preview.title;
            content.appendChild(image);
        }

        galleryLightboxMedia.appendChild(content);
        galleryLightbox.classList.remove("hidden");
        galleryLightboxClose.focus();
    }

    function hideGalleryLightbox() {
        galleryLightbox.classList.add("hidden");
        galleryLightboxMedia.innerHTML = "";
        galleryLightboxMedia.style.backgroundImage = "";
    }

    function setGalleryZoom(nextZoom) {
        galleryZoom = Math.max(0.5, Math.min(4, nextZoom));
        galleryLightboxMedia.style.setProperty("--gallery-zoom", galleryZoom);
        if (galleryZoomReset) {
            galleryZoomReset.textContent = `${Math.round(galleryZoom * 100)}%`;
        }
    }

    function zoomGallery(delta) {
        setGalleryZoom(galleryZoom + delta);
    }

    function preloadImage(src) {
        if (!src) return;
        const image = new Image();
        image.decoding = "async";
        image.src = src;
    }

    function prewarmGallery() {
        const run = () => {
            void getGalleryData().then((data) => {
                Object.values(data.characterIndex.characters).forEach((character) => {
                    preloadImage(character.animations.idle.src);
                });
            });
        };

        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(run, { timeout: 1800 });
        } else {
            window.setTimeout(run, 600);
        }
    }

    function applyLanguage(language) {
        const activeLanguage = setLanguage(language);
        document.title = t("menu.title");

        localizedNodes.forEach((node) => {
            const key = node.dataset.i18n;
            if (!key) return;
            node.textContent = t(`menu.${key}`, node.textContent);
        });

        languageOptions.forEach((option) => {
            option.classList.toggle("is-selected", option.dataset.language === activeLanguage);
        });
    }

    async function startNewGame() {
        mainMenu.classList.add("hidden");
        battleUi.classList.remove("hidden");

        if (!battleInitPromise) {
            battleInitPromise = initBattle();
        }

        await battleInitPromise;
    }

    menuItems.forEach((item) => {
        item.addEventListener("mouseenter", () => {
            if (item.disabled) return;
            previewMenuAction(item.dataset.menuAction);
        });

        item.addEventListener("focus", () => {
            if (item.disabled) return;
            previewMenuAction(item.dataset.menuAction);
        });

        item.addEventListener("click", async () => {
            if (item.disabled) return;

            const action = item.dataset.menuAction;
            if (action === "start") {
                await startNewGame();
                return;
            }

            if (action === "gallery") {
                await showGallery();
                return;
            }

            if (action === "tutorial") {
                showTutorial();
                return;
            }

            if (action === "options" || action === "credits" || action === "exit") {
                hideGallery();
                hideTutorial();
                showMenuCard(action, action);
            }
        });
    });

    galleryTabs.forEach((button) => {
        button.addEventListener("click", () => {
            void showGallery(button.dataset.galleryTab);
        });
    });

    galleryClose.addEventListener("click", hideGallery);
    tutorialClose.addEventListener("click", () => {
        hideTutorial();
        setActiveMenuItem("start");
    });

    tutorialTabs.forEach((button) => {
        button.addEventListener("click", () => {
            showTutorialTab(button.dataset.tutorialTab);
        });
    });

    galleryGrid.addEventListener("click", (event) => {
        const card = event.target.closest(".gallery-card");
        showGalleryLightbox(card?.galleryPreview);
    });

    galleryGrid.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const card = event.target.closest(".gallery-card");
        if (!card) return;
        event.preventDefault();
        showGalleryLightbox(card.galleryPreview);
    });

    galleryLightboxClose.addEventListener("click", hideGalleryLightbox);
    galleryZoomOut.addEventListener("click", () => zoomGallery(-0.25));
    galleryZoomReset.addEventListener("click", () => setGalleryZoom(1));
    galleryZoomIn.addEventListener("click", () => zoomGallery(0.25));

    galleryLightboxMedia.addEventListener("wheel", (event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        zoomGallery(event.deltaY > 0 ? -0.15 : 0.15);
    }, { passive: false });

    galleryLightbox.addEventListener("click", (event) => {
        if (event.target === galleryLightbox) {
            hideGalleryLightbox();
        }
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !galleryLightbox.classList.contains("hidden")) {
            hideGalleryLightbox();
        }
    });

    languageOptions.forEach((option) => {
        option.addEventListener("click", () => {
            hideGallery();
            hideTutorial();
            applyLanguage(option.dataset.language);
            showMenuCard("options", "options");
        });
    });

    applyLanguage(getLanguage());
    showMenuCard(null, "start");
    prewarmGallery();
}

setupMainMenu();
