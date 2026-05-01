import { characters } from "../data/characters.js";
import { enemyAliases, enemies } from "../data/enemies.js";
import { t } from "../i18n.js";

export const PLAYER_CHARACTER_IDS = ["girl", "officer", "man"];

function createBattleStats() {
    return {
        counters: 0,
        penalties: 0,
        defeats: 0,
        fastActions: 0,
        timeouts: 0
    };
}

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

export function createEnemyState(enemyId) {
    const resolvedEnemyId = enemyAliases[enemyId] ?? enemyId;
    const enemyTemplate = enemies[resolvedEnemyId];

    return {
        id: enemyTemplate.id,
        name: t(`enemy.${enemyTemplate.id}.name`, enemyTemplate.name),
        hp: enemyTemplate.hp,
        maxHp: enemyTemplate.hp,
        defeated: false,
        nextAttackMultiplier: 1,
        noDamageNextTurn: false,
        marked: false,
        pressure: 0,
        rotationIndex: -1,
        switchCooldown: 0,
        pendingIntent: null,
        supportStacks: 0,
        inactiveBodies: enemyTemplate.id === "pull" ? 2 : 0,
        phase: enemyTemplate.id === "convergence" ? 1 : null,
        stageLocked: false
    };
}

export function resetBattleStats(state) {
    state.combo = Math.max(0, Math.min(3, state.run.startingCombo));
    state.maxComboReached = state.combo;
    state.playerTurnScale = 1;
    state.activeTimingResult = null;
    state.lastResolvedDefense = null;
    state.currentDefense = null;
    state.enemyIntent = null;
    state.freeSwitch = false;
    state.manualSwitchUsed = false;
    state.lastAssistUsed = null;
    state.lastAttackUsed = {};
    state.stats = createBattleStats();
    state.meltdown = {
        active: false,
        roundsRemaining: 0
    };

    PLAYER_CHARACTER_IDS.forEach((id) => {
        state.roster[id].cooldowns = {};
        state.roster[id].usedOnce = {};
    });
}

export function createBattleState(enemyId = "familiar") {
    return {
        turn: "player",
        battleOver: false,
        outcome: null,
        combo: 1,
        maxComboReached: 1,
        playerTurnDurationMs: 7000,
        playerTurnScale: 1,
        activeTimingResult: null,
        lastResolvedDefense: null,
        activeCharacterId: "girl",
        currentDefense: null,
        enemyIntent: null,
        freeSwitch: false,
        manualSwitchUsed: false,
        lastAssistUsed: null,
        lastAttackUsed: {},
        meltdown: {
            active: false,
            roundsRemaining: 0
        },
        stats: createBattleStats(),
        run: {
            battleIndex: 0,
            enemyIndex: 0,
            completedBattles: 0,
            rewards: [],
            startingCombo: 1,
            damageBonus: 0,
            playerTurnBonusMs: 0,
            tigerGuard: 0,
            teamHpBonus: 0
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
        enemy: createEnemyState(enemyId)
    };
}
