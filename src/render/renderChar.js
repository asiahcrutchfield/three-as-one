import { playSpriteAnimation } from "./animations.js";

export async function loadCharacterIndex() {
    const response = await fetch("/assets/characters/index.json");
    return await response.json();
}

export function renderCharacter(characterIndex, characterId, animationName, slotId, side = "player") {
    const character = characterIndex.characters[characterId];
    const animation = character.animations[animationName];

    const slot = document.querySelector(`#${slotId}`);
    slot.innerHTML = "";

    const sprite = document.createElement("div");
    sprite.classList.add("combatant", "sprite");

    if (side === "player") sprite.classList.add("player-combatant");
    if (side === "enemy") sprite.classList.add("enemy-combatant");

    sprite.style.backgroundImage = `url("${animation.src}")`;
    sprite.style.backgroundRepeat = "no-repeat";

    sprite.dataset.characterId = characterId;
    sprite.dataset.animation = animationName;

    const stageScale = window.currentStageScale ?? 1;
    const charScale = animation.scale ?? 1;

    const characterViewportScale = window.characterViewportScale ?? 1;

    sprite.style.setProperty("--character-scale", characterViewportScale);

    if (side === "player") {
        sprite.classList.add("player-combatant");
    }

    if (side === "enemy") {
        sprite.classList.add("enemy-combatant");
    }

    slot.appendChild(sprite);

    playSpriteAnimation(sprite, animation, {
        loop: animation.loop ?? true
    });

    return sprite;
}