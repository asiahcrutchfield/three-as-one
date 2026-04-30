// stage rendering
import { stages } from "./data/stages.js";
import { renderStage } from "./render/renderStage.js";
// character rendering
import { loadCharacterIndex, renderCharacter } from "./render/renderChar.js";
// ui rendering
import {
    createPlayerHUD,
    createEnemyHUD
} from "./ui/hud/index.js";

const hudLayer = document.querySelector("#hud-layer");

const playerHUD = await createPlayerHUD();
const enemyHUD = await createEnemyHUD();

hudLayer.appendChild(playerHUD);
hudLayer.appendChild(enemyHUD);

renderStage(stages.paradise);

const characterIndex = await loadCharacterIndex();

renderCharacter(characterIndex, "girl", "idle", "player-slot", "player");