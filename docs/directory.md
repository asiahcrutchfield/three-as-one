# Project Directory

This is the directory structure of the "As One" game project, excluding the testing environment.

## Root Directory Files
- `index.html` - The main entry point for the game application.
- `style.css` - Global styling for the game interface and battle stage.
- `package.json` - Node project configuration and dependency list.
- `package-lock.json` - Exact dependency version lockfile.
- `README.md` - Project overview and general information.
- `.gitignore` - Git ignore rules.

## Assets (`public/`)
**Main Folder:** `public/`
- `public/assets/characters/index.json`
- `public/assets/stages/index.json`
- Contains numerous media files, including sprites (`.png`, `.gif`), videos (`.mp4`), and `.zip` archives organized by character (`girl`, `tiger`, `officer`, `man`) and state (e.g., `idle`).
- `public/assets/ui/` - Contains HTML, JS, and CSS files for all Web Components used in the interface:
  - `action_buttons/` (assist, attack, defense components)
  - `combo_meter/`
  - `cooldown/`
  - `health_bar/`
  - `portrait_frame/`
  - `results/`
  - `reward_selection/`
  - `switch/`
  - `timer/` and `timers/` (battle_timer, block_timer, counter_timer, dodge_timer)

## Game Data (`src/data/`)
**Main Folder:** `src/data/`
- Contains data definitions for the game.
- `battles.js` - Defines encounter logic and enemy waves.
- `characters.js` - Character statistics, passive effects, and ability properties.
- `enemies.js` - Enemy statistics and specific AI behavior.
- `progression.js` - Rules for advancing through the game.
- `stages.js` - Definitions for backgrounds and battle environments.

## Game Logic (`src/game/`)
**Main Folder:** `src/game/`
- Contains the core engine systems.
- `charAbilities.js` - Resolves logic for player attack, defense, and assist abilities.
- `combat.js` - The main combat orchestrator, handling turn flow and passives.
- `enemyAbilities.js` - Resolves enemy AI intent, attack routing, and meltdown logic.
- `state.js` - The central mutable `gameState` object containing player, tiger, and enemy variables.
- `statusEffect.js` - Functions to apply combo changes, locks, and marks.
- `visualFeedback.js` - Functions triggering CSS visual flashes or feedback based on events.

## Rendering & UI (`src/render/`)
**Main Folder:** `src/render/`
- Contains logic for rendering UI components.
- `animations.js` - Dynamically builds and controls sprite animations on the DOM.
- `renderChar.js` - Master initialization file linking DOM event listeners to the combat engine.
- `renderUI.js` - Functions for updating data attributes of custom UI Web Components.
- `renderStage.js` - Functions for updating background and stage assets.

## Documentation (`docs/`)
**Main Folder:** `docs/`
- Contains project documentation.
- `directory.md` - This file.
- `game-rules.md` - Comprehensive design document for combat mechanics and math.
- `gameplay.md` - High-level overview of the intended game loop and experience.
- `playtest.md` - Notes or instructions regarding gameplay testing.
- `TEST_DIRECTORY.md` - Documentation specifically detailing the isolated `src/testing/` environment.