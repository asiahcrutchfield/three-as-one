export const rewards = [
    {
        id: "hp_up",
        type: "stat",
        effect: (player) => {
            player.maxHp += 20;
        }
    },

    {
        id: "damage_up",
        type: "stat",
        effect: (player) => {
            player.baseDamage += 5;
        }
    },

    {
        id: "combo_boost",
        type: "system",
        effect: (state) => {
            state.comboGain += 0.2;
        }
    }
];