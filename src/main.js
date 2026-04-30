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
import { createActionMenu } from "./ui/actionMenu/index.js";
import { createAssists } from "./ui/assists/Assists.js";
import { createComboMeter } from "./ui/combo/Combo.js";
import { createActionTimer } from "./ui/actionTimer/ActionTimer.js";

const hudLayer = document.querySelector("#hud-layer");
const actionLayer = document.querySelector("#action-layer");
const battleStage = document.querySelector("#battle-stage");

const playerHUD = await createPlayerHUD();
const enemyHUD = await createEnemyHUD();
const assists = await createAssists();
const comboMeter = await createComboMeter();
const actionTimer = await createActionTimer();
const actionMenu = await createActionMenu();

hudLayer.appendChild(playerHUD);
hudLayer.appendChild(enemyHUD);
hudLayer.appendChild(assists);
hudLayer.appendChild(comboMeter);
battleStage.appendChild(actionTimer);
actionLayer.appendChild(actionMenu);

renderStage(stages.paradise);

const characterIndex = await loadCharacterIndex();

renderCharacter(characterIndex, "girl", "idle", "player-slot", "player");
