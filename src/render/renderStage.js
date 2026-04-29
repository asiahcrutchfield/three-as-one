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

    const stageWidth = battleStage.clientWidth;

    const originalW = stage.dimensions.w;
    const originalH = stage.dimensions.h;

    const scale = (stageWidth / originalW) * (stage.scale ?? 1);

    const renderedHeight = originalH * scale;
    const floorY = stage.floor.fromBottom * scale;

    battleLane.style.left = "0";
    battleLane.style.right = "0";
    battleLane.style.bottom = "0px";
    battleLane.style.height = `${renderedHeight}px`;
    battleLane.style.setProperty("--floor-y", `${floorY}px`);

    const groundLayer = document.querySelector(".ground-layer");

    if (groundLayer) {
        groundLayer.style.backgroundSize = `${stageWidth}px auto`;
    }
}