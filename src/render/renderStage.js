export function renderStage(stage) {
    setLayerImage(".sky-layer", stage.layers.sky);
    setLayerImage(".far-layer", stage.layers.far);
    setLayerImage(".mid-layer", stage.layers.mid);
    setLayerImage(".ground-layer", stage.layers.ground);
    setLayerImage(".foreground-layer", stage.layers.foreground);

    updateStageFloor(stage);

    window.addEventListener("resize", () => {
        updateStageFloor(stage);
    });
}

function setLayerImage(selector, imagePath) {
    const layer = document.querySelector(selector);

    if (!layer) return;

    if (!imagePath) {
        layer.style.backgroundImage = "none";
        return;
    }

    layer.style.backgroundImage = `url("${imagePath}")`;
}

function updateStageFloor(stage) {
    const battleStage = document.querySelector("#battle-stage");
    const battleLane = document.querySelector("#battle-lane");
    const groundLayer = document.querySelector(".ground-layer");

    const stageWidth = battleStage.clientWidth;

    const designWidth = 1366;

    // scale characters with screen size, but not too much
    const characterViewportScale = Math.max(
        0.75,
        Math.min(1, stageWidth / designWidth)
    );

    window.characterViewportScale = characterViewportScale;
    battleStage.style.setProperty("--character-viewport-scale", characterViewportScale);

    const originalW = stage.dimensions.w;
    const originalH = stage.dimensions.h;

    const scale = stageWidth / originalW;

    const renderedHeight = originalH * scale;
    const floorY = stage.floor.fromBottom * scale;

    window.currentStageScale = scale;

    battleLane.style.left = "0";
    battleLane.style.right = "0";
    battleLane.style.width = "100%";
    battleLane.style.bottom = "0px";
    battleLane.style.height = `${renderedHeight}px`;
    battleLane.style.transform = "none";
    battleLane.style.setProperty("--floor-y", `${floorY}px`);

    if (groundLayer) {
        groundLayer.style.backgroundSize = `${stageWidth}px auto`;
        groundLayer.style.backgroundPosition = "center bottom";
    }
}