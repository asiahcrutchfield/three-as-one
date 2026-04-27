export const characters = {
    man: {
        id: "man",
        name: "Man",
        role: "damage",

        stats: {
            maxHp: 120,
            baseDamage: 20
        },

        abilities: [
            {
                id: "burst",
                type: "attack",
                effect: (state) => state.baseDamage * state.combo
            }
        ]
    },

    officer: {
        id: "officer",
        name: "Officer",
        role: "defense",

        stats: {
            maxHp: 150,
            baseDamage: 10
        },

        abilities: [
            {
                id: "block_boost",
                type: "defense",
                effect: () => "reduce_damage"
            }
        ]
    },

    girl: {
        id: "girl",
        name: "Girl",
        role: "support",

        stats: {
            maxHp: 100
        },

        special: {
            usesTiger: true
        }
    }
};