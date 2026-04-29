// stage rendering
import { stages } from "./data/stages.js";
import { renderStage } from "./render/renderStage.js";
// character rendering
import { loadCharacterIndex, renderCharacter } from "./render/renderChar.js";

renderStage(stages.paradise);

const characterIndex = await loadCharacterIndex();

renderCharacter(characterIndex, "officer", "idle", "player-slot", "player");