export const rewards = [
    {
        id: "hp_up",
        label: "+20 Team HP",
        effect: (state) => {
            if (state.player) {
                state.player.maxHp = (state.player.maxHp || 100) + 20;
                state.player.hp = Math.min(state.player.maxHp, (state.player.hp || 100) + 20);
            }
        }
    },
    {
        id: "damage_up",
        label: "+10% Damage",
        effect: (state) => {
            state.damageBonus = (state.damageBonus || 0) + 0.1;
        }
    },
    {
        id: "combo_boost",
        label: "+0.1 Combo Gain",
        effect: (state) => {
            state.comboGainBonus = (state.comboGainBonus || 0) + 0.1;
        }
    },
    {
        id: "timer_focus",
        label: "+1s Decision Time",
        effect: (state) => {
            state.timerBonus = (state.timerBonus || 0) + 1;
        }
    },
    {
        id: "sync_boost",
        label: "Faster Sync",
        effect: (state) => {
            state.syncGainBonus = (state.syncGainBonus || 0) + 0.5;
        }
    }
];

export function getRewardsForGrade(grade) {
    let count = 0;
    if (grade === "S") count = 4;
    else if (grade === "A") count = 3;
    else if (grade === "B") count = 2;
    else if (grade === "C") count = 1;

    // Return random subset of rewards
    const shuffled = [...rewards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}