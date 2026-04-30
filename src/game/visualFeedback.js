function getSlot(slotId) {
    return document.querySelector(`#${slotId}`);
}

function getEffectTarget(slotId) {
    const slot = getSlot(slotId);
    return slot?.querySelector(".combat-unit, .sprite, .combatant") || slot;
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
        const target = getEffectTarget(event.slotId);
        const slot = getSlot(event.slotId);

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
