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

    switchesRemaining: 1,
    enemyIntent: null,
    enemyModifiers: { damageBoost: 0 }
};