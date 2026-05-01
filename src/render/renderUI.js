import { characters } from "../data/characters.js";
import { enemyAliases, enemies } from "../data/enemies.js";
import { getConvergenceStatusChips } from "../game/convergence.js";
import {
    getCharacterHp,
    getCharacterMaxHp,
    getGirlEmotion,
    getInactiveCharacterIds,
    isCharacterUnavailable
} from "../game/statusEffect.js";

function getHpColor(percent) {
    const hue = Math.max(0, Math.min(120, Math.round(percent * 120)));
    return `hsla(${hue}, 78%, 48%, 0.72)`;
}

function setBar(track, value, max) {
    if (!track) return;

    const fill = track.querySelector(".stat-fill");
    const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

    if (fill) {
        fill.style.width = `${pct * 100}%`;
        fill.style.background = getHpColor(pct);
    }

    const valueEl = track.querySelector(".stat-value");
    const maxEl = track.querySelector(".stat-max");
    if (valueEl) valueEl.textContent = `${value}`;
    if (maxEl) maxEl.textContent = `${max}`;
}

function getIntentIconSvg(intent) {
    const range = intent?.shownRange || intent?.range || intent?.type;

    if (range === "close") {
        return `<svg viewBox="0 0 24 24" role="presentation"><path d="M4 17.5 9.5 6l2.3 5.2L16 4l4 13.5-4.4-3.2-3.3 5.2-2.7-6.1L4 17.5Z" /></svg>`;
    }

    if (range === "long") {
        return `<svg viewBox="0 0 24 24" role="presentation"><path d="M4 11h10.2l-2.8-2.8L13 6.6 20.4 14 13 21.4l-1.6-1.6 2.8-2.8H4v-6Z" /></svg>`;
    }

    return `<svg viewBox="0 0 24 24" role="presentation"><path d="M12 3 15 9l6 1-4.5 4.2 1.1 6L12 17l-5.6 3.2 1.1-6L3 10l6-1 3-6Z" /></svg>`;
}

function getEnemyTemplate(enemyId) {
    return enemies[enemyAliases[enemyId] ?? enemyId] ?? enemies.familiar;
}

function getIntentModifierChips(intent) {
    if (!intent) return [];

    const shownRange = intent.shownRange || intent.range || intent.type;
    const chips = [];

    if (intent.fake) {
        chips.push({ label: "Fake", tone: "warning" });
    } else if (shownRange === "close" && intent.type === "attack") {
        chips.push({ label: "Counter", tone: "good" });
    } else if (shownRange === "long" && intent.type === "attack") {
        chips.push({ label: "No Counter", tone: "neutral" });
    } else if (shownRange === "status" || intent.type === "status") {
        chips.push({ label: "Status", tone: "neutral" });
    }

    if (intent.delayed) {
        chips.push({ label: "Delayed", tone: "info" });
    }

    return chips;
}

function getEnemyStatusChips(state) {
    const chips = [];

    if ((state.enemy.pressure ?? 0) > 0) {
        chips.push({ label: `Pressure ${state.enemy.pressure}`, tone: "warning" });
    }

    if (state.enemy.nextAttackMultiplier > 1) {
        chips.push({ label: "Damage Up", tone: "warning" });
    }

    if ((state.enemy.switchCooldown ?? 0) > 0) {
        chips.push({ label: "Switch Lock", tone: "neutral" });
    }

    if ((state.enemy.supportStacks ?? 0) > 0) {
        chips.push({ label: `Support ${state.enemy.supportStacks}`, tone: "info" });
    }

    if ((state.enemy.inactiveBodies ?? 0) > 0 && state.enemy.id === "pull") {
        chips.push({ label: `Bodies ${state.enemy.inactiveBodies}`, tone: "neutral" });
    }

    if (state.enemy.pendingIntent) {
        chips.push({ label: "Delayed", tone: "warning" });
    }

    getConvergenceStatusChips(state).forEach((label) => {
        chips.push({ label, tone: "neutral" });
    });

    return chips;
}

function hidePreviewNoise() {
    document.querySelector("#sync-preview")?.classList.add("hidden");
    document.querySelector("#results-preview")?.classList.add("hidden");
    document.querySelector("#rewards-preview")?.classList.add("hidden");
    document.querySelectorAll(".combat-callout").forEach((node) => node.classList.add("hidden"));
}

export function createBattleUI({ playerHUD, enemyHUD, assists, comboMeter, actionMenu, battleStage }) {
    const resultsPreview = document.querySelector("#results-preview");
    const rewardsPreview = document.querySelector("#rewards-preview");
    resultsPreview?.classList.add("hidden");
    rewardsPreview?.classList.add("hidden");
    hidePreviewNoise();

    const enemyIntent = document.querySelector("#enemy-intent-preview");
    const enemyStatus = document.querySelector("#enemy-status-preview");
    const pauseButton = document.createElement("button");
    pauseButton.id = "pause-button";
    pauseButton.type = "button";
    pauseButton.textContent = "Pause";
    battleStage.appendChild(pauseButton);

    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "pause-overlay";
    pauseOverlay.className = "hidden";
    pauseOverlay.innerHTML = `
        <div class="pause-card">
            <div class="pause-title">Paused</div>
            <div class="pause-copy">Timers and inputs are frozen for testing.</div>
        </div>
    `;
    battleStage.appendChild(pauseOverlay);

    const battleIntro = document.createElement("div");
    battleIntro.id = "battle-intro-overlay";
    battleIntro.className = "hidden";
    battleIntro.innerHTML = `
        <div class="battle-intro-card">
            <div class="battle-intro-kicker">Battle Start</div>
            <div class="battle-intro-ready">Ready?</div>
            <div class="battle-intro-title">Battle Start</div>
            <div class="battle-intro-copy">Battle 1</div>
        </div>
    `;
    battleStage.appendChild(battleIntro);

    const battleTransition = document.createElement("div");
    battleTransition.id = "battle-transition-overlay";
    battleTransition.className = "hidden";
    battleStage.appendChild(battleTransition);

    const enemyActionCallout = document.createElement("div");
    enemyActionCallout.id = "enemy-action-callout";
    enemyActionCallout.className = "hidden";
    enemyActionCallout.innerHTML = `
        <div class="enemy-action-card">
            <div class="enemy-action-name">Attack</div>
        </div>
    `;
    battleStage.appendChild(enemyActionCallout);

    const gameOver = document.createElement("div");
    gameOver.id = "game-over-popup";
    gameOver.className = "hidden";
    gameOver.innerHTML = `
        <div class="game-over-card">
            <div class="game-over-title">Game Over</div>
            <div class="game-over-copy">The battle has ended.</div>
            <button type="button" class="game-over-button">Start Again</button>
        </div>
    `;
    battleStage.appendChild(gameOver);

    gameOver.querySelector(".game-over-button")?.addEventListener("click", () => {
        window.location.reload();
    });

    return {
        playerHUD,
        enemyHUD,
        assists,
        comboMeter,
        actionMenu,
        enemyIntent,
        enemyStatus,
        resultsPreview,
        rewardsPreview,
        battleIntro,
        battleTransition,
        enemyActionCallout,
        gameOver,
        pauseButton,
        pauseOverlay
    };
}

export function updateBattleUI(state, ui, menuData) {
    const activeId = state.activeCharacterId;
    if (!activeId) return;

    const activeCharacter = characters[activeId];
    const playerPortrait = ui.playerHUD.querySelector(".portrait-slot img");
    const tigerPortrait = ui.playerHUD.querySelector(".portrait-slot2 img");
    const tigerFrame = ui.playerHUD.querySelector(".portrait-slot2");
    const nameEl = ui.playerHUD.querySelector(".name");
    const specialStat = ui.playerHUD.querySelector(".special-stat");
    const playerTrack = ui.playerHUD.querySelector(".stat-track");
    const enemyTrack = ui.enemyHUD.querySelector(".stat-track");
    const enemyName = ui.enemyHUD.querySelector(".name");
    const enemyPortrait = ui.enemyHUD.querySelector(".portrait-slot img");
    const comboFill = ui.comboMeter.querySelector(".combo-preview-fill");
    const comboValue = ui.comboMeter.querySelector(".combo-preview-value");
    const intentIcon = ui.enemyIntent?.querySelector(".intent-preview-icon");
    const intentName = ui.enemyIntent?.querySelector(".intent-preview-name");
    const intentMeta = ui.enemyIntent?.querySelector(".intent-preview-meta");
    const enemyTemplate = getEnemyTemplate(state.enemy.id);

    if (activeId === "girl") {
        const emotion = getGirlEmotion(state);
        if (playerPortrait) playerPortrait.src = `/assets/characters/girl/emotions/girl_${emotion}.png`;
        if (tigerPortrait) tigerPortrait.src = "/assets/characters/tiger/portrait/tiger_portrait.png";
        if (tigerFrame) tigerFrame.classList.remove("hidden");
        if (nameEl) nameEl.textContent = "Girl + Tiger";
        if (specialStat) {
            specialStat.textContent = emotion;
            specialStat.classList.remove("hidden");
        }
    } else {
        if (playerPortrait) playerPortrait.src = `/assets/characters/${activeId}/portrait/${activeId}_portrait.png`;
        if (tigerFrame) tigerFrame.classList.add("hidden");
        if (nameEl) nameEl.textContent = activeCharacter.name;
        if (specialStat) specialStat.classList.add("hidden");
    }

    setBar(playerTrack, getCharacterHp(state, activeId), getCharacterMaxHp(state, activeId));
    setBar(enemyTrack, state.enemy.hp, state.enemy.maxHp);

    if (enemyName) enemyName.textContent = state.enemy.name;
    if (enemyPortrait) {
        enemyPortrait.src = enemyTemplate.portraitPath;
        enemyPortrait.alt = `${state.enemy.name} portrait`;
    }

    const inactiveIds = getInactiveCharacterIds(state);
    const playerCards = [...ui.assists.querySelectorAll("#player-assist-preview .assist-preview-card")];
    playerCards.forEach((card, index) => {
        const id = inactiveIds[index];
        if (!id) {
            card.classList.add("hidden");
            return;
        }

        const portrait = card.querySelector("img");
        const track = card.querySelector(".stat-track");
        const value = getCharacterHp(state, id);
        const maxValue = getCharacterMaxHp(state, id);
        const portraitPath = id === "girl"
            ? `/assets/characters/girl/emotions/girl_${getGirlEmotion(state)}.png`
            : `/assets/characters/${id}/portrait/${id}_portrait.png`;

        card.classList.remove("hidden");
        card.classList.toggle("is-defeated", isCharacterUnavailable(state, id));
        if (portrait) portrait.src = portraitPath;
        setBar(track, value, maxValue);
    });

    const comboPct = Math.max(0, Math.min(1, state.combo / 3));
    if (comboFill) comboFill.style.width = `${comboPct * 100}%`;
    if (comboValue) comboValue.textContent = `x${state.combo.toFixed(1)}`;

    if (intentIcon) intentIcon.innerHTML = getIntentIconSvg(state.enemyIntent);
    if (intentName) intentName.textContent = state.enemyIntent?.label || "Intent Hidden";
    if (intentMeta) {
        intentMeta.innerHTML = getIntentModifierChips(state.enemyIntent)
            .map((chip) => `<span class="intent-chip ${chip.tone}">${chip.label}</span>`)
            .join("");
    }

    if (ui.enemyStatus) {
        const chips = getEnemyStatusChips(state);
        if (chips.length) {
            ui.enemyStatus.classList.remove("hidden");
            ui.enemyStatus.innerHTML = `
                <div class="ui-preview-kicker">Enemy Status</div>
                <div class="state-chip-row">
                    ${chips.map((chip) => `<span class="state-chip ${chip.tone}">${chip.label}</span>`).join("")}
                </div>
            `;
        } else {
            ui.enemyStatus.classList.add("hidden");
        }
    }

    ui.actionMenu.setMenuData(menuData);
}

export function showGameOver(ui, outcome) {
    const title = ui.gameOver.querySelector(".game-over-title");
    const copy = ui.gameOver.querySelector(".game-over-copy");
    const button = ui.gameOver.querySelector(".game-over-button");

    if (title) title.textContent = outcome === "victory" ? "Victory" : "Game Over";
    if (copy) copy.textContent = outcome === "victory"
        ? "The enemy has been defeated."
        : "All available characters have fallen.";
    if (button) button.textContent = "Start Again";

    ui.gameOver.classList.remove("hidden");
}

export function showBattleIntro(ui, { title, subtitle, kicker = "Battle Start", durationMs = 1200, variant = "message", phaseLabel = "Ready?" } = {}) {
    const overlay = ui.battleIntro;
    if (!overlay) return Promise.resolve();

    const kickerEl = overlay.querySelector(".battle-intro-kicker");
    const readyEl = overlay.querySelector(".battle-intro-ready");
    const titleEl = overlay.querySelector(".battle-intro-title");
    const copyEl = overlay.querySelector(".battle-intro-copy");

    overlay.classList.remove(
        "hidden",
        "is-entering",
        "is-leaving",
        "is-ready-phase",
        "is-start-phase",
        "is-message-variant",
        "is-battle-start-variant"
    );
    void overlay.offsetWidth;

    if (kickerEl) {
        kickerEl.textContent = kicker;
        kickerEl.classList.toggle("hidden", !kicker);
    }
    if (readyEl) readyEl.textContent = phaseLabel;
    if (titleEl) titleEl.textContent = title ?? "Battle";
    if (copyEl) {
        copyEl.textContent = subtitle ?? "";
        copyEl.classList.toggle("hidden", !subtitle);
    }

    if (variant === "battle-start" || variant === "battle-end") {
        overlay.classList.add("is-battle-start-variant", "is-ready-phase");

        return new Promise((resolve) => {
            window.setTimeout(() => {
                overlay.classList.remove("is-ready-phase");
                overlay.classList.add("is-start-phase");

                window.setTimeout(() => {
                    overlay.classList.remove("is-start-phase");
                    overlay.classList.add("is-leaving");

                    window.setTimeout(() => {
                        overlay.classList.add("hidden");
                        overlay.classList.remove("is-leaving", "is-battle-start-variant");
                        resolve();
                    }, 360);
                }, 1000);
            }, 1050);
        });
    }

    overlay.classList.add("is-message-variant", "is-entering");

    return new Promise((resolve) => {
        window.setTimeout(() => {
            overlay.classList.remove("is-entering");
            overlay.classList.add("is-leaving");

            window.setTimeout(() => {
                overlay.classList.add("hidden");
                overlay.classList.remove("is-leaving", "is-message-variant");
                resolve();
            }, 320);
        }, durationMs);
    });
}

export function playBattleTransition(ui, { holdMs = 1000, fadeOutMs = 500, fadeInMs = 500, onBlackout = null } = {}) {
    const overlay = ui.battleTransition;
    if (!overlay) return Promise.resolve();

    overlay.style.setProperty("--battle-transition-fade-out-ms", `${fadeOutMs}ms`);
    overlay.style.setProperty("--battle-transition-fade-in-ms", `${fadeInMs}ms`);
    overlay.classList.remove("hidden", "is-fade-in", "is-fade-out");
    void overlay.offsetWidth;
    overlay.classList.add("is-fade-out");

    return new Promise((resolve) => {
        window.setTimeout(() => {
            overlay.classList.remove("is-fade-out");

            Promise.resolve(onBlackout?.()).then(() => {
                window.setTimeout(() => {
                    overlay.classList.add("is-fade-in");

                    window.setTimeout(() => {
                        overlay.classList.add("hidden");
                        overlay.classList.remove("is-fade-in");
                        resolve();
                    }, fadeInMs);
                }, holdMs);
            });
        }, fadeOutMs);
    });
}

export function showEnemyActionCallout(ui, label, durationMs = 720) {
    const callout = ui.enemyActionCallout;
    if (!callout) return Promise.resolve();

    const nameEl = callout.querySelector(".enemy-action-name");
    if (nameEl) nameEl.textContent = label ?? "Attack";

    callout.classList.remove("hidden", "is-entering", "is-leaving");
    void callout.offsetWidth;
    callout.classList.add("is-entering");

    return new Promise((resolve) => {
        window.setTimeout(() => {
            callout.classList.remove("is-entering");
            callout.classList.add("is-leaving");

            window.setTimeout(() => {
                callout.classList.add("hidden");
                callout.classList.remove("is-leaving");
                resolve();
            }, 220);
        }, durationMs);
    });
}

export function hideProgressionPanels(ui) {
    ui.resultsPreview?.classList.add("hidden");
    ui.rewardsPreview?.classList.add("hidden");
}

export function showBattleSummary(ui, summary) {
    if (!ui.resultsPreview) return;

    ui.resultsPreview.innerHTML = `
        <div class="ui-preview-kicker">Battle Summary</div>
        <div class="reward-grade-stamp battle-grade-stamp">${summary.grade}</div>
        <div class="results-preview-grid">
            <div><span>HP Bonus</span><strong>+${summary.hpBonus}</strong></div>
            <div><span>Combo Bonus</span><strong>+${summary.comboBonus}</strong></div>
            <div><span>Counters</span><strong>+${summary.counterBonus}</strong></div>
            <div><span>Penalties</span><strong>-${summary.penaltyTotal}</strong></div>
        </div>
        <div class="results-preview-rank">
            <span>Final Score</span>
            <strong>${summary.finalScore}</strong>
        </div>
    `;

    ui.resultsPreview.classList.remove("hidden");
}

export function showRewardChoices(ui, rewards, { onSelect, finalBattle = false } = {}) {
    if (!ui.rewardsPreview) return;

    const title = finalBattle ? "Run Complete" : "Reward Choice";
    const items = rewards.length
        ? rewards.map((reward, index) => `
            <button type="button" class="reward-preview-item ${index === 0 ? "is-active" : ""}" data-reward-id="${reward.id}">
                <span class="reward-preview-name">${reward.label}</span>
                <span class="reward-preview-desc">${reward.description}</span>
            </button>
        `).join("")
        : `
            <button type="button" class="reward-preview-item is-active" data-reward-id="continue">
                <span class="reward-preview-name">${finalBattle ? "Victory" : "Continue"}</span>
                <span class="reward-preview-desc">${finalBattle ? "The run is complete." : "Move on to the next battle."}</span>
            </button>
        `;

    ui.rewardsPreview.innerHTML = `
        <div class="ui-preview-kicker">${title}</div>
        <div class="reward-preview-list">${items}</div>
    `;

    ui.rewardsPreview.classList.remove("hidden");

    ui.rewardsPreview.querySelectorAll("[data-reward-id]").forEach((button) => {
        button.addEventListener("click", () => {
            onSelect?.(button.dataset.rewardId);
        });
    });
}
