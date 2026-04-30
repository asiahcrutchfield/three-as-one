import { getResponsiveAnimationScale, playSpriteAnimation } from "./animations.js";

export async function loadCharacterIndex() {
    const response = await fetch("/assets/characters/index.json");
    return await response.json();
}

function createSprite(characterIndex, characterId, animationName, side = "player") {
    const character = characterIndex.characters[characterId];
    const animation = character.animations[animationName];

    const sprite = document.createElement("div");
    sprite.classList.add("combatant", "sprite");

    if (side === "player") sprite.classList.add("player-combatant");
    if (side === "enemy") sprite.classList.add("enemy-combatant");

    sprite.style.backgroundImage = `url("${animation.src}")`;
    sprite.style.backgroundRepeat = "no-repeat";

    sprite.dataset.characterId = characterId;
    sprite.dataset.animation = animationName;

    const characterViewportScale = window.characterViewportScale ?? 1;
    sprite.style.setProperty("--character-scale", characterViewportScale);

    playSpriteAnimation(sprite, animation, {
        loop: animation.loop ?? true
    });

    return sprite;
}

function getMemberBounds(characterIndex, member, animationName) {
    const character = characterIndex.characters[member.id];
    const animation = character.animations[animationName];
    const scale = getResponsiveAnimationScale(animation);

    return {
        left: member.offsetX ?? 0,
        bottom: member.offsetY ?? 0,
        width: animation.frameWidth * scale,
        height: animation.frameHeight * scale
    };
}

export function renderCharacter(characterIndex, characterId, animationName, slotId, side = "player") {
    const slot = document.querySelector(`#${slotId}`);
    slot.innerHTML = "";
    const sprite = createSprite(characterIndex, characterId, animationName, side);

    slot.appendChild(sprite);

    return sprite;
}

export function renderStaticCombatant(imageSrc, slotId, side = "player") {
    const slot = document.querySelector(`#${slotId}`);
    if (!slot) return null;

    slot.innerHTML = "";

    const sprite = document.createElement("div");
    sprite.classList.add("combatant", "sprite", "static-combatant");

    if (side === "player") sprite.classList.add("player-combatant");
    if (side === "enemy") sprite.classList.add("enemy-combatant");

    sprite.style.backgroundImage = `url("${imageSrc}")`;
    sprite.style.backgroundRepeat = "no-repeat";
    sprite.style.backgroundPosition = "center bottom";
    sprite.style.backgroundSize = "contain";
    sprite.style.width = "240px";
    sprite.style.height = "360px";
    sprite.style.setProperty("--character-viewport-scale", "1");

    slot.appendChild(sprite);
    return sprite;
}

export function renderUnit(characterIndex, unitId, animationName, slotId, side = "player") {
    const slot = document.querySelector(`#${slotId}`);
    const unit = characterIndex.units?.[unitId];

    if (!slot || !unit) return null;

    slot.innerHTML = "";

    const container = document.createElement("div");
    container.classList.add("combat-unit");
    if (side === "player") container.classList.add("player-unit");
    if (side === "enemy") container.classList.add("enemy-unit");

    const memberBounds = unit.members.map((member) => ({
        member,
        ...getMemberBounds(characterIndex, member, animationName)
    }));

    const minLeft = Math.min(...memberBounds.map((entry) => entry.left));
    const minBottom = Math.min(...memberBounds.map((entry) => entry.bottom));
    const maxRight = Math.max(...memberBounds.map((entry) => entry.left + entry.width));
    const maxTop = Math.max(...memberBounds.map((entry) => entry.bottom + entry.height));

    const unitWidth = maxRight - minLeft;
    const unitHeight = maxTop - minBottom;

    container.style.width = `${unitWidth}px`;
    container.style.height = `${unitHeight}px`;

    memberBounds.forEach((entry, index) => {
        const { member, left, bottom } = entry;
        const sprite = createSprite(characterIndex, member.id, animationName, side);
        sprite.classList.add("unit-member");
        if (index > 0) sprite.classList.add("unit-member--front");

        sprite.style.left = `${left - minLeft}px`;
        sprite.style.bottom = `${bottom - minBottom}px`;
        sprite.style.zIndex = `${member.z ?? index + 1}`;

        if (side === "enemy") {
            sprite.style.left = "auto";
            sprite.style.right = `${left - minLeft}px`;
        }

        container.appendChild(sprite);
    });

    slot.appendChild(container);
    return container;
}
