import { characters } from "../data/characters.js";
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

function hidePreviewNoise() {
    document.querySelector("#sync-preview")?.classList.add("hidden");
    document.querySelector("#results-preview")?.classList.add("hidden");
    document.querySelector("#rewards-preview")?.classList.add("hidden");
    document.querySelectorAll(".combat-callout").forEach((node) => node.classList.add("hidden"));
}

export function createBattleUI({ playerHUD, enemyHUD, assists, comboMeter, actionMenu, battleStage }) {
    hidePreviewNoise();

    const enemyIntent = document.querySelector("#enemy-intent-preview");
    const enemyStatus = document.querySelector("#enemy-status-preview");
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
        gameOver
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
    if (enemyPortrait) enemyPortrait.src = "/assets/enemies/familiar/familiar.png";

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

    if (ui.enemyStatus) {
        if (state.enemy.nextAttackMultiplier > 1) {
            ui.enemyStatus.classList.remove("hidden");
            ui.enemyStatus.innerHTML = `
                <div class="ui-preview-kicker">Enemy Status</div>
                <div class="state-chip-row">
                    <span class="state-chip warning">Damage Up</span>
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

    if (title) title.textContent = outcome === "victory" ? "Victory" : "Game Over";
    if (copy) copy.textContent = outcome === "victory"
        ? "The enemy has been defeated."
        : "All available characters have fallen.";

    ui.gameOver.classList.remove("hidden");
}
