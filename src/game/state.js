export const gameState = {
    status: "Player Turn",

    player: {
        id: "girl",
        hp: 100,
        maxHp: 100
    },

    enemy: {
        id: "striker",
        hp: 100,
        maxHp: 100
    },

    combo: 1.0,
    turn: "player",
    
    // Playtest Combat State Variables
    lastPlayerAction: null,
    activeDefense: null,
    enemyIntent: null,
    switchesRemaining: 1,
    
    // Status Effects
    pendingAttacks: [],
    timerMultiplier: 1.0,
    comboLocked: false,
    comboDelayed: false,
    delayedComboGain: 0,
    tigerMarked: false,
    enemyDamageMultiplier: 1.0
};