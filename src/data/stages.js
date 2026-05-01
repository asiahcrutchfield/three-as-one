let cachedStages = null;

export function normalizeStageConfig(id, rawStage) {
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

export async function loadStages() {
    if (cachedStages) return cachedStages;

    const response = await fetch("/assets/stages/index.json");
    const rawStages = await response.json();

    cachedStages = Object.fromEntries(
        Object.entries(rawStages).map(([id, stage]) => [id, normalizeStageConfig(id, stage)])
    );

    return cachedStages;
}
