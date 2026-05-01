import { characters } from "../data/characters.js";
import { enemyAliases, enemies } from "../data/enemies.js";
import { getConvergenceStatusChips } from "../game/convergence.js";
import {
    getCharacterHp,
    getCharacterMaxHp,
    getGirlEmotion,
    getInactiveCharacterIds,
    isMeltdownActive,
    isCharacterUnavailable
} from "../game/statusEffect.js";
import { t } from "../i18n.js";

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

function getCharacterDisplayName(id) {
    return t(`character.${id}`, characters[id]?.name ?? id);
}

function getEnemyDisplayName(enemyId) {
    const enemyTemplate = getEnemyTemplate(enemyId);
    return t(`enemy.${enemyTemplate.id}.name`, enemyTemplate.name);
}

function getIntentLabel(intent) {
    if (!intent) return t("ui.intentHidden");
    return t(`enemyAbility.${intent.id}.label`, intent.label);
}

function getIntentModifierChips(intent) {
    if (!intent) return [];

    const shownRange = intent.shownRange || intent.range || intent.type;
    const chips = [];

    if (intent.fake) {
        chips.push({ label: t("status.fake"), tone: "warning" });
    } else if (shownRange === "close" && intent.type === "attack") {
        chips.push({ label: t("status.counter"), tone: "good" });
    } else if (shownRange === "long" && intent.type === "attack") {
        chips.push({ label: t("status.noCounter"), tone: "neutral" });
    } else if (shownRange === "status" || intent.type === "status") {
        chips.push({ label: t("status.status"), tone: "neutral" });
    }

    if (intent.delayed) {
        chips.push({ label: t("status.delayed"), tone: "info" });
    }

    return chips;
}

function getEnemyStatusChips(state) {
    const chips = [];

    if ((state.enemy.pressure ?? 0) > 0) {
        chips.push({ label: t("status.pressure", `Pressure ${state.enemy.pressure}`, { value: state.enemy.pressure }), tone: "warning" });
    }

    if (state.enemy.nextAttackMultiplier > 1) {
        chips.push({ label: t("status.damageUp"), tone: "warning" });
    }

    if ((state.enemy.switchCooldown ?? 0) > 0) {
        chips.push({ label: t("status.switchLock"), tone: "neutral" });
    }

    if ((state.enemy.supportStacks ?? 0) > 0) {
        chips.push({ label: t("status.support", `Support ${state.enemy.supportStacks}`, { value: state.enemy.supportStacks }), tone: "info" });
    }

    if ((state.enemy.inactiveBodies ?? 0) > 0 && state.enemy.id === "pull") {
        chips.push({ label: t("status.bodies", `Bodies ${state.enemy.inactiveBodies}`, { value: state.enemy.inactiveBodies }), tone: "neutral" });
    }

    if (state.enemy.pendingIntent) {
        chips.push({ label: t("status.delayed"), tone: "warning" });
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
    const battleIntro = document.createElement("div");
    battleIntro.id = "battle-intro-overlay";
    battleIntro.className = "hidden";
    battleIntro.innerHTML = `
        <div class="battle-intro-card">
            <div class="battle-intro-kicker">${t("ui.battleStart")}</div>
            <div class="battle-intro-ready">${t("ui.ready")}</div>
            <div class="battle-intro-title">${t("ui.battleStart")}</div>
            <div class="battle-intro-copy">${t("ui.battle")} 1</div>
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
            <div class="enemy-action-name">${t("ui.attack")}</div>
        </div>
    `;
    battleStage.appendChild(enemyActionCallout);

    const gameOver = document.createElement("div");
    gameOver.id = "game-over-popup";
    gameOver.className = "hidden";
    gameOver.innerHTML = `
        <div class="game-over-card">
            <div class="game-over-title">${t("ui.gameOver")}</div>
            <div class="game-over-copy">${t("ui.defeat")}</div>
            <button type="button" class="game-over-button">${t("ui.startAgain")}</button>
        </div>
    `;
    battleStage.appendChild(gameOver);

    const runResults = document.createElement("div");
    runResults.id = "run-results-overlay";
    runResults.className = "hidden";
    battleStage.appendChild(runResults);

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
        runResults,
        pauseButton: null,
        pauseOverlay: null
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
    const meltdownStat = ui.playerHUD.querySelector(".meltdown-stat");
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

    ui.playerHUD.classList.toggle("is-meltdown", isMeltdownActive(state));

    if (activeId === "girl") {
        const emotion = getGirlEmotion(state);
        if (playerPortrait) playerPortrait.src = `/assets/characters/girl/emotions/girl_${emotion}.png`;
        if (tigerPortrait) tigerPortrait.src = "/assets/characters/tiger/portrait/tiger_portrait.png";
        if (tigerFrame) tigerFrame.classList.remove("hidden");
        if (nameEl) nameEl.textContent = t("character.girlTiger");
        if (specialStat && !isMeltdownActive(state)) {
            specialStat.textContent = t(`emotion.${emotion}`, emotion);
            specialStat.classList.remove("hidden");
        }
    } else {
        if (playerPortrait) playerPortrait.src = `/assets/characters/${activeId}/portrait/${activeId}_portrait.png`;
        if (tigerFrame) tigerFrame.classList.add("hidden");
        if (nameEl) nameEl.textContent = getCharacterDisplayName(activeId);
        if (specialStat) specialStat.classList.add("hidden");
    }

    if (isMeltdownActive(state)) {
        if (specialStat) specialStat.classList.add("hidden");
        if (meltdownStat) {
            meltdownStat.textContent = `${t("ui.meltdown")} ${state.meltdown?.roundsRemaining ?? 0}R`;
            meltdownStat.classList.remove("hidden");
        }
    } else if (meltdownStat) {
        meltdownStat.classList.add("hidden");
    }

    setBar(playerTrack, getCharacterHp(state, activeId), getCharacterMaxHp(state, activeId));
    setBar(enemyTrack, state.enemy.hp, state.enemy.maxHp);

    if (enemyName) enemyName.textContent = getEnemyDisplayName(state.enemy.id);
    if (enemyPortrait) {
        enemyPortrait.src = enemyTemplate.portraitPath;
        enemyPortrait.alt = `${getEnemyDisplayName(state.enemy.id)} portrait`;
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
    const comboLabel = ui.comboMeter.querySelector(".combo-preview-label");
    const comboMax = ui.comboMeter.querySelector(".combo-preview-max");
    if (comboLabel) comboLabel.textContent = t("ui.momentum");
    if (comboMax) comboMax.textContent = t("ui.maxCombo");

    if (intentIcon) intentIcon.innerHTML = getIntentIconSvg(state.enemyIntent);
    if (intentName) intentName.textContent = getIntentLabel(state.enemyIntent);
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
            ui.enemyStatus.querySelector(".ui-preview-kicker").textContent = t("ui.enemyStatus");
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

    if (title) title.textContent = outcome === "victory" ? t("ui.victory") : t("ui.gameOver");
    if (copy) copy.textContent = outcome === "victory"
        ? t("ui.enemyDefeated")
        : t("ui.allFallen");
    if (button) button.textContent = t("ui.startAgain");

    ui.gameOver.classList.remove("hidden");
}

export function showBattleIntro(ui, { title, subtitle, kicker = t("ui.battleStart"), durationMs = 1200, variant = "message", phaseLabel = t("ui.ready") } = {}) {
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
        "is-battle-start-variant",
        "is-danger-variant"
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

    if (variant === "battle-start" || variant === "battle-end" || variant === "meltdown") {
        overlay.classList.add("is-battle-start-variant", "is-ready-phase");
        overlay.classList.toggle("is-danger-variant", variant === "meltdown");

        return new Promise((resolve) => {
            window.setTimeout(() => {
                overlay.classList.remove("is-ready-phase");
                overlay.classList.add("is-start-phase");

                window.setTimeout(() => {
                    overlay.classList.remove("is-start-phase");
                    overlay.classList.add("is-leaving");

                    window.setTimeout(() => {
                        overlay.classList.add("hidden");
                        overlay.classList.remove("is-leaving", "is-battle-start-variant", "is-danger-variant");
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
    if (nameEl) nameEl.textContent = label ?? t("ui.attack");

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
        <div class="ui-preview-kicker">${t("ui.battleSummary")}</div>
        <div class="reward-grade-stamp battle-grade-stamp">${summary.grade}</div>
        <div class="results-preview-grid">
            <div><span>${t("ui.hpBonus")}</span><strong>+${summary.hpBonus}</strong></div>
            <div><span>${t("ui.comboBonus")}</span><strong>+${summary.comboBonus}</strong></div>
            <div><span>${t("ui.counters")}</span><strong>+${summary.counterBonus}</strong></div>
            <div><span>${t("ui.fastActions", "Fast Actions")}</span><strong>+${summary.fastBonus}</strong></div>
            <div><span>${t("ui.penalties")}</span><strong>-${summary.penaltyTotal}</strong></div>
        </div>
        <div class="results-preview-rank">
            <span>${t("ui.finalScore")}</span>
            <strong>${summary.finalScore}</strong>
        </div>
    `;

    ui.resultsPreview.classList.remove("hidden");
}

export function showRewardChoices(ui, rewards, { onSelect, finalBattle = false } = {}) {
    if (!ui.rewardsPreview) return;

    const title = finalBattle ? t("ui.runComplete") : t("ui.rewardChoice");
    const items = rewards.length
        ? rewards.map((reward, index) => `
            <button type="button" class="reward-preview-item ${index === 0 ? "is-active" : ""}" data-reward-id="${reward.id}">
                <span class="reward-preview-name">${t(`reward.${reward.id}.label`, reward.label)}</span>
                <span class="reward-preview-desc">${t(`reward.${reward.id}.description`, reward.description)}</span>
            </button>
        `).join("")
        : `
            <button type="button" class="reward-preview-item is-active" data-reward-id="continue">
                <span class="reward-preview-name">${finalBattle ? t("ui.victory") : t("ui.continue")}</span>
                <span class="reward-preview-desc">${finalBattle ? t("ui.runCompleteDesc") : t("ui.continueDesc")}</span>
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

export function showRunResults(ui, summary, { onReturn } = {}) {
    if (!ui.runResults) return;

    ui.runResults.innerHTML = `
        <div class="run-results-card">
            <div class="ui-preview-kicker">${t("ui.runResults", "Run Results")}</div>
            <div class="run-results-grade">${summary.grade}</div>
            <div class="run-results-grid">
                <div><span>${t("ui.hpBonus")}</span><strong>+${summary.hpBonus}</strong></div>
                <div><span>${t("ui.comboBonus")}</span><strong>+${summary.comboBonus}</strong></div>
                <div><span>${t("ui.counters")}</span><strong>+${summary.counterBonus}</strong></div>
                <div><span>${t("ui.fastActions", "Fast Actions")}</span><strong>+${summary.fastBonus}</strong></div>
                <div><span>${t("ui.penalties")}</span><strong>-${summary.penaltyTotal}</strong></div>
            </div>
            <div class="run-results-score">
                <span>${t("ui.finalScore")}</span>
                <strong>${summary.finalScore}</strong>
            </div>
            <button type="button" class="run-results-button">${t("ui.returnToMenu", "Return to Main Menu")}</button>
        </div>
    `;

    ui.runResults.classList.remove("hidden", "is-visible");
    void ui.runResults.offsetWidth;
    ui.runResults.classList.add("is-visible");

    ui.runResults.querySelector(".run-results-button")?.addEventListener("click", () => {
        onReturn?.();
    });
}
