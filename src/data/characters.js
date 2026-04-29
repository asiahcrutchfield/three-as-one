export const characters = {
    girl: {
        id: "girl",
        name: "Girl",
        role: "adaptive",
        stage: "/assets/stages/paradise/battle_lane.png",

        stats: {
            maxHp: 100,
            tigerMaxHp: 100
        },

        getEmotion(tigerHp, tigerMaxHp) {
            const pct = tigerHp / tigerMaxHp;

            if (pct >= 0.75) return "happy";
            if (pct >= 0.5) return "neutral";
            if (pct >= 0.25) return "worried";
            return "sad";
        },

        abilities: {
            attack: {
                pounce: {
                    range: "close",
                    getDamage(emotion) {
                        return {
                            happy: 24,
                            neutral: 18,
                            worried: 14,
                            sad: 10
                        }[emotion];
                    }
                },

                rockThrow: {
                    range: "long",
                    getDamage(emotion) {
                        return {
                            happy: 18,
                            neutral: 12,
                            worried: 8,
                            sad: 6
                        }[emotion];
                    }
                }
            },

            defense: {
                block: {
                    getReduction(emotion) {
                        return {
                            happy: 0.7,
                            neutral: 0.5,
                            worried: 0.3,
                            sad: 0.2
                        }[emotion];
                    }
                },

                dodge: {
                    getWindow(emotion) {
                        return {
                            happy: 3,
                            neutral: 2.5,
                            worried: 2,
                            sad: 1.5
                        }[emotion];
                    }
                },

                counter: {
                    getValues(emotion) {
                        return {
                            happy: { dmg: 1.5, combo: 0.5, window: 2.5 },
                            neutral: { dmg: 1.25, combo: 0.25, window: 2 },
                            worried: { dmg: 1.0, combo: 0.25, window: 1.5 },
                            sad: { dmg: 0.75, combo: 0.25, window: 1 }
                        }[emotion];
                    }
                }
            },

            special: {
                comfort: {
                    cooldown: 3,
                    getHealPercent(emotion) {
                        return {
                            happy: 0.30,
                            neutral: 0.25,
                            worried: 0.20,
                            sad: 0.15
                        }[emotion];
                    }
                },

                tigersRoar: {
                    once: true,
                    getDamagePercent(emotion) {
                        return {
                            happy: 0.35,
                            neutral: 0.30,
                            worried: 0.25,
                            sad: 0.20
                        }[emotion];
                    },
                    effect(state) {
                        state.enemy.noDamageNextTurn = true;
                    }
                }
            }
        },

        assist: {
            active: {
                id: "good_vibes",
                cooldown: 3,
                getValues(emotion) {
                    return {
                        happy: { active: 0.25, inactive: 0.15 },
                        neutral: { active: 0.20, inactive: 0.15 },
                        worried: { active: 0.15, inactive: 0.10 },
                        sad: { active: 0.10, inactive: 0.05 }
                    }[emotion];
                }
            },

            passive: {
                getRegen(emotion, meltdown) {
                    if (meltdown) return 0;

                    return {
                        happy: 0.04,
                        neutral: 0.02,
                        worried: 0.015,
                        sad: 0.01
                    }[emotion];
                }
            }
        },

        meltdown: {
            duration: 3,
            damageBoost: 0.25,
            comboBonus: 0.25,
            unstableMissChance: 0.25
        }
    },

    officer: {
        id: "officer",
        name: "Officer",
        role: "control",
        stage: "/assets/stages/taipei/battle_lane.png",

        stats: {
            maxHp: 150
        },

        abilities: {
            attack: {
                batonStrike: {
                    range: "close",
                    base: 14,
                    bonusIfSuppressed: 6
                },

                gunShot: {
                    range: "long",
                    damage: 9,
                    apply(target) {
                        target.marked = true;
                    }
                }
            },

            defense: {
                block: {
                    reduction: 0.7,
                    combo: 0.15,
                    cannotRepeat: true
                },

                counter: {
                    dmg: 1.1,
                    combo: 0.25,
                    easier: true
                },

                dodge: {
                    combo: 0.25
                }
            },

            special: {
                suppress: {
                    effect(target) {
                        target.damageMultiplier = 0.5;
                    }
                },

                backup: {
                    once: true,
                    effect(state) {
                        state.freeSwitch = true;
                        state.combo += 0.5;
                    }
                }
            }
        },

        assist: {
            active: {
                id: "tactical_focus",
                name: "Tactical Focus",
                cost: 1,

                effect(state) {
                    if (state.combo < 1) return false;

                    state.combo -= 1;
                    state.timerSlow = 0.6;
                    state.revealEnemyIntent = true;

                    if (state.enemy) {
                        state.enemy.damageMultiplier = 0.5;
                    }

                    return true;
                }
            },

            passive: {
                effect(state) {
                    state.damageReduction = 0.03;
                }
            }
        }
    },

    man: {
        id: "man",
        name: "Man",
        role: "high-risk",
        stage: "/assets/stages/nola/battle_lane.png",

        stats: {
            maxHp: 120
        },

        passive(user) {
            const pct = user.hp / user.maxHp;
            if (pct <= 0.10) return 0.20;
            if (pct <= 0.25) return 0.10;
            return 0;
        },

        abilities: {
            attack: {
                heavySwing: {
                    range: "close",
                    base: 18,
                    combo: 0.75
                },

                bottleThrow: {
                    range: "long",
                    damage: 12,
                    combo: 0,
                    penaltyOnRepeat: true
                }
            },

            defense: {
                counter: {
                    dmg: 1.75,
                    combo: 0.75,
                    hardest: true
                },

                block: {
                    reduction: 0.4,
                    combo: 0.15
                },

                dodge: {}
            },

            special: {
                overexert: {
                    damage: 40,
                    selfDamage: 15,
                    minHp: 1,
                    combo: 0.25
                },

                allIn: {
                    consumeCombo: true,
                    base: 18,
                    maxMultiplier: 4
                }
            }
        },

        assist: {
            active: {
                id: "improv",
                effect(target) {
                    if (!target.isBoss) {
                        target.hp -= Math.floor(target.hp * 0.15);
                    }
                }
            },

            passive: {
                effect(state) {
                    state.damageBonus = 0.05;
                }
            }
        }
    }
};