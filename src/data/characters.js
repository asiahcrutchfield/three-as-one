export const characters = {
    girl: {
        id: "girl",
        name: "Girl",
        role: "adaptive support/offense",
        stats: {
            maxHp: 100,
            tigerMaxHp: 100,
            baseDamage: 16
        },
        blockReduction: 0.5,
        counterDamageMultiplier: 1.5,
        abilities: [
            {
                id: "pounce",
                type: "attack",
                range: "close",
                damage: 18,
                comboGain: 0.25,
                effect: (state, user, target) => { }
            },
            {
                id: "rock_throw",
                type: "attack",
                range: "long",
                damage: 12,
                comboGain: 0.25,
                effect: (state, user, target) => { }
            },
            {
                id: "comfort",
                type: "heal",
                cooldown: 3,
                effect: (state, user, target) => {
                    if (state.player && state.player.hp !== undefined) {
                        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20);
                    }
                }
            }
        ],
        activeAssist: {
            id: "good_vibes",
            cooldown: 3,
            effect: (state) => {
                if (state.player && state.player.hp !== undefined) {
                    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20);
                }
            }
        },
        passiveAssist: {
            id: "calm_presence",
            effect: (state) => {
                // passive small sustain
            }
        }
    },
    officer: {
        id: "officer",
        name: "Officer",
        role: "control/safety",
        stats: {
            maxHp: 150,
            baseDamage: 14
        },
        blockReduction: 0.7,
        counterDamageMultiplier: 1.1,
        abilities: [
            {
                id: "baton_strike",
                type: "attack",
                range: "close",
                damage: 14,
                effect: (state, user, target) => {
                    if (target && target.status === "suppressed") {
                        return 6; // bonus damage handled downstream
                    }
                    return 0;
                }
            },
            {
                id: "gun_shot",
                type: "attack",
                range: "long",
                damage: 9,
                effect: (state, user, target) => {
                    if (target) target.status = "marked";
                }
            },
            {
                id: "suppress",
                type: "status",
                cooldown: 2,
                effect: (state, user, target) => {
                    if (target) target.status = "suppressed";
                }
            }
        ],
        activeAssist: {
            id: "tactical_focus",
            cooldown: 3,
            effect: (state) => {
                if (state.combo >= 1) state.combo -= 1;
                state.timerBonus = (state.timerBonus || 0) + 2;
            }
        },
        passiveAssist: {
            id: "tactical_support",
            effect: (state) => {
                state.damageTakenMultiplier = 0.97;
            }
        }
    },
    man: {
        id: "man",
        name: "Man",
        role: "risky burst damage",
        stats: {
            maxHp: 120,
            baseDamage: 18
        },
        blockReduction: 0.4,
        counterDamageMultiplier: 1.75,
        passiveEffect: (state, user) => {
            if (!user) return 0;
            const hpPct = user.hp / user.maxHp;
            if (hpPct <= 0.10) return 0.20;
            if (hpPct <= 0.25) return 0.10;
            return 0;
        },
        abilities: [
            {
                id: "heavy_swing",
                type: "attack",
                range: "close",
                damage: 18,
                comboGain: 0.25,
                effect: (state, user, target) => { }
            },
            {
                id: "bottle_throw",
                type: "attack",
                range: "long",
                damage: 12,
                comboGain: 0,
                effect: (state, user, target) => { }
            },
            {
                id: "overexert",
                type: "attack",
                damage: 40,
                comboGain: 0.25,
                effect: (state, user, target) => {
                    if (user && user.hp > 15) {
                        user.hp = Math.max(1, user.hp - 15);
                    }
                }
            }
        ],
        activeAssist: {
            id: "improv",
            cooldown: 3,
            effect: (state, target) => {
                if (target && target.id !== "trinity_breaker") {
                    target.hp -= Math.floor(target.hp * 0.15);
                }
            }
        },
        passiveAssist: {
            id: "taunt",
            effect: (state) => {
                state.damageBonus = (state.damageBonus || 0) + 0.05;
            }
        }
    }
};