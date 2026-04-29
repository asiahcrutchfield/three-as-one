# Testing Directory

This document describes the directory structure of the testing environment located in `src/testing/`.

## Root Testing Files
**Folder:** `src/testing/`
- `index.html` - The main entry point for the testing ground.
- `script.js` - Top-level orchestration script for the main testing ground.
- `style.css` - Styles specific to the testing environment and debug borders.
- `ui-viewer.html` - A specialized sandbox for inspecting individual UI Web Components.
- `ui-viewer.js` - Logic driving the UI component sandbox.

## Testing Data
**Folder:** `src/testing/data/`
- Cloned data definitions to allow safe modification during prototyping.
- `battles.js`
- `characters.js`
- `enemies.js`
- `progression.js`
- `stages.js`

## Testing Game Logic
**Folder:** `src/testing/game/`
- Isolated game logic modules simulating combat independently of the main game.
- `charAbilities.js`
- `combat.js`
- `enemyAbilities.js`
- `state.js`
- `statusEffect.js`
- `visualFeedback.js`

## Testing Render & UI
**Folder:** `src/testing/render/`
- Experimental rendering logic and isolated animation tests.
- `animations.js` - Mock or experimental animation logic for the test container.
- `render.js` - Test-specific event listeners and visual orchestration.
- `renderUI.js` - Test-specific UI updating functions.
