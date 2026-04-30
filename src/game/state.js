import { characters } from "../data/characters.js";
import { enemies } from "../data/enemies.js";

export const PLAYER_CHARACTER_IDS = ["girl", "officer", "man"];

function createCharacterState(id) {
    return {
        id,
        hp: 100,
        maxHp: characters[id].stats.maxHp,
        defeated: false,
        unavailable: false,
        cooldowns: {},
        usedOnce: {}
    };
}

export function createBattleState(enemyId = "familiar") {
    const enemyTemplate = enemies[enemyId];

    return {
        turn: "player",
        battleOver: false,
        outcome: null,
        combo: 1,
        maxComboReached: 1,
        playerTurnDurationMs: 7000,
        playerTurnScale: 1,
        activeTimingResult: null,
        activeCharacterId: "girl",
        currentDefense: null,
        enemyIntent: null,
        freeSwitch: false,
        lastAssistUsed: null,
        lastAttackUsed: {},
        stats: {
            counters: 0,
            penalties: 0,
            defeats: 0,
            fastActions: 0,
            timeouts: 0
        },
        roster: {
            girl: createCharacterState("girl"),
            officer: createCharacterState("officer"),
            man: createCharacterState("man")
        },
        tiger: {
            hp: 100,
            maxHp: 100,
            defeated: false
        },
        enemy: {
            id: enemyTemplate.id,
            name: enemyTemplate.name,
            hp: 100,
            maxHp: enemyTemplate.hp,
            defeated: false,
            nextAttackMultiplier: 1,
            noDamageNextTurn: false,
            marked: false
        }
    };
}
