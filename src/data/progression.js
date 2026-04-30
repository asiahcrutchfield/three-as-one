export const rewards = [
    {
        id: "team_training",
        label: "+20 Team HP",
        description: "Raise max HP for the whole roster and heal 20 HP.",
        effect: (state) => {
            state.run.teamHpBonus += 20;

            ["girl", "officer", "man"].forEach((id) => {
                state.roster[id].maxHp += 20;
                state.roster[id].hp = Math.min(state.roster[id].maxHp, state.roster[id].hp + 20);
            });

            state.tiger.maxHp += 20;
            state.tiger.hp = Math.min(state.tiger.maxHp, state.tiger.hp + 20);
            state.roster.girl.hp = state.tiger.hp;
        }
    },
    {
        id: "sharpened_edge",
        label: "+10% Damage",
        description: "Increase all outgoing player damage.",
        effect: (state) => {
            state.run.damageBonus += 0.1;
        }
    },
    {
        id: "timer_boost",
        label: "+1s Decision Time",
        description: "Add 1 second to the player turn timer.",
        effect: (state) => {
            state.run.playerTurnBonusMs += 1000;
        }
    },
    {
        id: "combo_boost",
        label: "Start x1.25",
        description: "Begin each new battle with more momentum.",
        effect: (state) => {
            state.run.startingCombo = Math.min(3, Number((state.run.startingCombo + 0.25).toFixed(2)));
        }
    },
    {
        id: "tiger_guard",
        label: "Tiger Guard",
        description: "Tiger takes 10% less direct damage.",
        effect: (state) => {
            state.run.tigerGuard = Math.min(0.4, state.run.tigerGuard + 0.1);
        }
    }
];

export function getRewardsForGrade(grade) {
    let count = 1;
    if (grade === "S") count = 3;
    else if (grade === "A") count = 3;
    else if (grade === "B") count = 2;
    else if (grade === "C") count = 2;

    const shuffled = [...rewards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
