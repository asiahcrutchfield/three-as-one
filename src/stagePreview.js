import { loadCharacterIndex, renderCharacter, renderStaticCombatant, renderUnit } from "./render/renderChar.js";
import { renderStage } from "./render/renderStage.js";
import { enemies } from "./data/enemies.js";

const stageSelect = document.querySelector("#stage-select");
const playerSelect = document.querySelector("#player-select");
const enemySelect = document.querySelector("#enemy-select");
const floorSlider = document.querySelector("#floor-slider");
const floorInput = document.querySelector("#floor-input");
const floorValue = document.querySelector("#floor-value");
const stageDimensions = document.querySelector("#stage-dimensions");
const laneHeight = document.querySelector("#lane-height");
const stageJsonOutput = document.querySelector("#stage-json-output");

function normalizeStageConfig(id, rawStage) {
    return {
        id,
        name: rawStage.name,
        layers: {
            sky: rawStage.layers?.sky,
            far: rawStage.layers?.far,
            mid: rawStage.layers?.mid,
            ground: rawStage.layers?.ground,
            foreground: rawStage.layers?.foreground
        },
        lane: {
            bottom: rawStage.lane?.bottom ?? 0,
            height: rawStage.lane?.height ?? 340
        },
        floor: {
            fromBottom: rawStage.floor?.fromBottom ?? 0
        },
        dimensions: {
            w: rawStage.dimensions?.w ?? 1366,
            h: rawStage.dimensions?.h ?? 768
        },
        fitmode: rawStage.fitmode ?? "width",
        worldScale: rawStage.worldScale ?? rawStage.scale ?? 1
    };
}

function cloneStage(stage) {
    return JSON.parse(JSON.stringify(stage));
}

function renderPlayer(characterIndex, playerId) {
    if (playerId === "girl_tiger") {
        renderUnit(characterIndex, "girl_tiger", "idle", "player-slot", "player");
        return;
    }

    renderCharacter(characterIndex, playerId, "idle", "player-slot", "player");
}

function renderEnemy(enemyId) {
    const enemy = enemies[enemyId] ?? enemies.familiar;
    const scaleById = {
        familiar: 0.74,
        order: 0.82,
        watcher: 0.78,
        convergence: 1.08
    };

    renderStaticCombatant(enemy.spritePath, "enemy-slot", "enemy", {
        scale: scaleById[enemy.id] ?? 0.8
    });
}

function updateReadout(stage) {
    floorValue.textContent = `${stage.floor.fromBottom}px`;
    stageDimensions.textContent = `${stage.dimensions.w} × ${stage.dimensions.h}`;
    laneHeight.textContent = `${stage.lane.height}px`;
    stageJsonOutput.textContent = JSON.stringify({
        [stage.id]: {
            name: stage.name,
            layers: stage.layers,
            lane: stage.lane,
            floor: stage.floor,
            dimensions: stage.dimensions,
            scale: stage.worldScale
        }
    }, null, 4);
}

async function initStagePreview() {
    const response = await fetch("/assets/stages/index.json");
    const rawStages = await response.json();
    const stages = Object.fromEntries(
        Object.entries(rawStages).map(([id, stage]) => [id, normalizeStageConfig(id, stage)])
    );
    const characterIndex = await loadCharacterIndex();

    Object.values(stages).forEach((stage) => {
        const option = document.createElement("option");
        option.value = stage.id;
        option.textContent = stage.name;
        stageSelect.appendChild(option);
    });

    let currentStage = cloneStage(stages[stageSelect.value || "paradise"] ?? Object.values(stages)[0]);

    function renderCurrentStage() {
        renderStage(currentStage);
        renderPlayer(characterIndex, playerSelect.value);
        renderEnemy(enemySelect.value);
        floorSlider.value = `${currentStage.floor.fromBottom}`;
        floorInput.value = `${currentStage.floor.fromBottom}`;
        updateReadout(currentStage);
    }

    stageSelect.addEventListener("change", () => {
        currentStage = cloneStage(stages[stageSelect.value]);
        renderCurrentStage();
    });

    playerSelect.addEventListener("change", () => {
        renderPlayer(characterIndex, playerSelect.value);
    });

    enemySelect.addEventListener("change", () => {
        renderEnemy(enemySelect.value);
    });

    function applyFloorValue(nextValue) {
        currentStage.floor.fromBottom = Math.max(0, Number(nextValue) || 0);
        renderStage(currentStage);
        floorSlider.value = `${currentStage.floor.fromBottom}`;
        floorInput.value = `${currentStage.floor.fromBottom}`;
        updateReadout(currentStage);
    }

    floorSlider.addEventListener("input", () => {
        applyFloorValue(floorSlider.value);
    });

    floorInput.addEventListener("input", () => {
        applyFloorValue(floorInput.value);
    });

    renderCurrentStage();
}

initStagePreview();
