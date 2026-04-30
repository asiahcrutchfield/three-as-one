function getSlot(slotId) {
    return document.querySelector(`#${slotId}`);
}

function getEffectTarget(slotId, targetCharacterId = null) {
    const slot = getSlot(slotId);
    if (!slot) return null;

    if (targetCharacterId) {
        const specificTarget = slot.querySelector(`.sprite[data-character-id="${targetCharacterId}"]`);
        if (specificTarget) return specificTarget;
    }

    if (slotId === "player-slot") {
        const tigerSprite = slot.querySelector('.sprite[data-character-id="tiger"]');
        if (tigerSprite) return tigerSprite;
    }

    return slot?.querySelector(".combat-unit, .sprite, .combatant") || slot;
}

function showRoarWave(slotId, target) {
    const slot = getSlot(slotId);
    if (!slot || !target) return;

    const wave = document.createElement("div");
    wave.className = "roar-wave";

    const targetRect = target.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const isEnemyFacingLeft = target.classList.contains("enemy-combatant");
    const mouthX = isEnemyFacingLeft ? 0.16 : 0.84;
    const centerX = targetRect.left - slotRect.left + (targetRect.width * mouthX);
    const centerY = targetRect.top - slotRect.top + (targetRect.height * 0.34);

    wave.style.left = `${centerX}px`;
    wave.style.top = `${centerY}px`;
    slot.appendChild(wave);

    window.setTimeout(() => wave.remove(), 520);
}

export function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function pulseClass(element, className, duration = 420) {
    if (!element) return;

    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
}

function clearDefeatState(element) {
    if (!element) return;
    element.classList.remove("combat-gone");
}

function applyPersistentDefeatState(element) {
    if (!element) return;
    element.classList.add("combat-gone");
}

function playMotion(element, className, duration) {
    pulseClass(element, className, duration);
}

function showFloatingText(slotId, label, variant = "damage") {
    const slot = getSlot(slotId);
    if (!slot) return;

    const bubble = document.createElement("div");
    bubble.className = `battle-float battle-float--${variant}`;
    bubble.textContent = label;
    slot.appendChild(bubble);

    window.setTimeout(() => bubble.remove(), 900);
}

export async function playCombatFeedback(events = []) {
    for (const event of events) {
        const target = getEffectTarget(event.slotId, event.targetCharacterId ?? null);
        const slot = getSlot(event.slotId);

        if (event.kind === "attack") {
            const motionClass = {
                melee: "combat-motion--melee",
                ranged: "combat-motion--ranged",
                heavy: "combat-motion--heavy",
                recoil: "combat-motion--recoil",
                pounce: "combat-motion--pounce",
                roar: "combat-motion--roar"
            }[event.style || "melee"];

            playMotion(target, motionClass, event.style === "heavy" ? 300 : 240);
            if (event.style === "roar") {
                showRoarWave(event.slotId, target);
            }
            await wait(event.style === "heavy" ? 180 : 140);
            continue;
        }

        if (event.kind === "dodge") {
            playMotion(target, "combat-motion--dodge", 260);
            if (event.label) showFloatingText(event.slotId, event.label, "defense");
            await wait(180);
            continue;
        }

        if (event.kind === "damage") {
            pulseClass(target, "combat-flash--damage");
            pulseClass(slot, "combat-shake");
            showFloatingText(event.slotId, `-${event.amount}`, "damage");
            await wait(260);
            continue;
        }

        if (event.kind === "defense") {
            pulseClass(target, "combat-flash--defense");
            if (event.label) showFloatingText(event.slotId, event.label, "defense");
            await wait(220);
            continue;
        }

        if (event.kind === "counter") {
            pulseClass(target, "combat-flash--counter");
            if (event.label) showFloatingText(event.slotId, event.label, "counter");
            await wait(260);
            continue;
        }

        if (event.kind === "heal") {
            showFloatingText(event.slotId, `+${event.amount}`, "heal");
            await wait(220);
            continue;
        }

        if (event.kind === "text") {
            showFloatingText(event.slotId, event.label, "text");
            await wait(220);
        }
    }
}

export async function playBattleFinishSequence(outcome = "victory") {
    const battleStage = document.querySelector("#battle-stage");
    pulseClass(battleStage, "battle-finish-slowmo", 560);
    await wait(420);

    if (outcome === "victory") {
        const enemyTarget = getEffectTarget("enemy-slot");
        clearDefeatState(enemyTarget);
        pulseClass(enemyTarget, "combat-defeat--enemy", 760);
        await wait(760);
        applyPersistentDefeatState(enemyTarget);
        return;
    }

    const playerTarget = getEffectTarget("player-slot");
    pulseClass(playerTarget, "combat-defeat--player", 620);
    await wait(420);
}

export function resetCombatantDefeatState(slotId) {
    clearDefeatState(getEffectTarget(slotId));
}
