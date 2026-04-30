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
import { chooseEnemyIntent, evaluateDefenseTiming, getDefenseTimingConfig, resolveEnemyTurn } from "./game/enemyAbilities.js";
import { createBattleState } from "./game/state.js";
import { applyComboChange, getPlayerTurnDuration, healInactiveCharacters, resolveDefeatState, tickCooldowns } from "./game/statusEffect.js";
import { playCombatFeedback, wait } from "./game/visualFeedback.js";
import { createBattleUI, showGameOver, updateBattleUI } from "./render/renderUI.js";

const hudLayer = document.querySelector("#hud-layer");
const actionLayer = document.querySelector("#action-layer");
const battleStage = document.querySelector("#battle-stage");

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

    renderStage(stages.paradise);

    const characterIndex = await loadCharacterIndex();
    const battleState = createBattleState();
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
    let activeTurnTimer = null;
    const timingKeys = ["W", "A", "S", "D"];
    const timingDebug = document.createElement("div");
    timingDebug.id = "timing-debug";
    timingDebug.className = "hidden";
    battleStage.appendChild(timingDebug);

    renderStaticCombatant("/assets/enemies/familiar/familiar.png", "enemy-slot", "enemy");

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

    function syncBattleUI() {
        renderActiveCharacter();
        updateBattleUI(battleState, ui, buildActionMenuData(battleState));
    }

    function setTimingDebug(lines = [], visible = true) {
        timingDebug.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
        timingDebug.classList.toggle("hidden", !visible);
    }

    function stopTurnTimer() {
        if (!activeTurnTimer) return null;

        const snapshot = activeTurnTimer.stop();
        activeTurnTimer = null;
        return snapshot;
    }

    function startPlayerTurnTimer() {
        stopTurnTimer();

        const durationMs = getPlayerTurnDuration(battleState);
        battleState.playerTurnScale = 1;
        const startTime = performance.now();
        let rafId = null;
        let settled = false;

        function tick(now) {
            if (settled) return;

            const elapsed = now - startTime;
            const remainingMs = Math.max(0, durationMs - elapsed);
            ui.actionMenu.setTurnTimer({ durationMs, remainingMs, visible: true });

            if (remainingMs <= 0) {
                settled = true;
                ui.actionMenu.setTurnTimer({ durationMs, remainingMs: 0, visible: true });
                activeTurnTimer = null;
                window.setTimeout(() => handlePlayerTimeout(), 0);
                return;
            }

            rafId = window.requestAnimationFrame(tick);
        }

        activeTurnTimer = {
            stop() {
                if (settled) return null;
                settled = true;
                if (rafId) window.cancelAnimationFrame(rafId);
                const elapsed = performance.now() - startTime;
                const remainingMs = Math.max(0, durationMs - elapsed);
                return {
                    durationMs,
                    remainingMs,
                    isFast: remainingMs >= durationMs / 2
                };
            }
        };

        rafId = window.requestAnimationFrame(tick);
    }

    function getRandomTimingKey() {
        return timingKeys[Math.floor(Math.random() * timingKeys.length)];
    }

    async function runDefenseTimingChallenge() {
        const config = getDefenseTimingConfig(battleState, battleState.enemyIntent);
        if (!config) return null;

        return await new Promise((resolve) => {
            const durationMs = config.durationMs;
            const startTime = performance.now();
            const expectedKey = getRandomTimingKey();
            let rafId = null;
            let settled = false;
            let lastPressedKey = null;

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

                const elapsedMs = Math.min(durationMs, performance.now() - startTime);
                const elapsedRatio = Math.max(0, Math.min(1, elapsedMs / durationMs));
                const remainingRatio = Math.max(0, Math.min(1, 1 - elapsedRatio));

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
                        `Cursor: ${(Math.max(0, Math.min(1, 1 - ((performance.now() - startTime) / durationMs))) * 100).toFixed(1)}`
                    ]);
                    return;
                }
                finish(true, true);
            }

            function tick(now) {
                if (settled) return;

                const elapsed = now - startTime;
                const remainingMs = Math.max(0, durationMs - elapsed);
                const remainingRatio = Math.max(0, Math.min(1, remainingMs / durationMs));

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

                setTimingDebug([
                    `Defense: ${battleState.currentDefense}`,
                    `Prompt: ${expectedKey}`,
                    `Cursor: ${(remainingRatio * 100).toFixed(1)}`,
                    `Window: ${((config.goodWindowStart ?? 0) * 100).toFixed(0)}-${((config.goodWindowEnd ?? 0) * 100).toFixed(0)}`,
                    `Perfect: ${config.perfectWindowStart !== undefined ? `${(config.perfectWindowStart * 100).toFixed(0)}-${(config.perfectWindowEnd * 100).toFixed(0)}` : "--"}`
                ]);

                if (remainingMs <= 0) {
                    finish(false, false);
                    return;
                }

                rafId = window.requestAnimationFrame(tick);
            }

            window.addEventListener("keydown", handleKeydown);
            rafId = window.requestAnimationFrame(tick);
        });
    }

    async function finishBattleIfNeeded() {
        resolveDefeatState(battleState);

        if (!battleState.battleOver) return false;

        stopTurnTimer();
        ui.actionMenu.setTurnTimer({ durationMs: getPlayerTurnDuration(battleState), remainingMs: 0, visible: true });
        actionTimer.setState({ visible: false });
        ui.actionMenu.setLocked(true);
        showGameOver(ui, battleState.outcome);
        return true;
    }

    async function endRoundAndResume() {

        resolveDefeatState(battleState);
        const healed = healInactiveCharacters(battleState);
        tickCooldowns(battleState);

        if (healed.length) {
            await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: "Bench Regen" }]);
        }

        if (await finishBattleIfNeeded()) {
            resolvingTurn = false;
            return;
        }

        battleState.enemyIntent = chooseEnemyIntent(battleState);
        syncBattleUI();
        ui.actionMenu.setLocked(false);
        resolvingTurn = false;
        startPlayerTurnTimer();
    }

    async function runEnemyPhase() {
        await wait(180);

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

        await endRoundAndResume();
    }

    async function handlePlayerTimeout() {
        if (resolvingTurn || battleState.battleOver) return;

        resolvingTurn = true;
        ui.actionMenu.setLocked(true);
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
        ui.actionMenu.setLocked(true);

        if (timingSnapshot?.isFast) {
            applyComboChange(battleState, 0.25);
            battleState.stats.fastActions += 1;
        }

        const playerResult = resolvePlayerAction(battleState, item);
        syncBattleUI();
        await playCombatFeedback(playerResult.feedback);

        if (timingSnapshot?.isFast) {
            await playCombatFeedback([{ kind: "text", slotId: "player-slot", label: "Fast Action +0.25" }]);
        }

        if (await finishBattleIfNeeded()) {
            resolvingTurn = false;
            return;
        }

        await runEnemyPhase();
    }

    battleState.enemyIntent = chooseEnemyIntent(battleState);
    syncBattleUI();
    startPlayerTurnTimer();

    actionMenu.addEventListener("actionselected", async (event) => {
        if (resolvingTurn || battleState.battleOver) return;
        const timingSnapshot = stopTurnTimer();
        await runBattleExchange(event.detail.item, timingSnapshot);
    });
}

initBattle();
