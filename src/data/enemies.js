function pickAbility(enemy, abilityId) {
    return enemy.abilities.find((ability) => ability.id === abilityId);
}

function withTelegraphMeta(ability, overrides = {}) {
    return {
        ...ability,
        shownRange: overrides.shownRange ?? ability.shownRange ?? ability.range ?? ability.type,
        fake: overrides.fake ?? ability.fake ?? false,
        delayed: overrides.delayed ?? ability.delayed ?? false,
        description: overrides.description ?? ability.description
    };
}

export const enemies = {
    familiar: {
        id: "familiar",
        name: "Familiar",
        hp: 100,
        role: "Balanced / Tutorial",
        theme: "Something that feels safe but is not.",
        spritePath: "/assets/enemies/familiar/familiar.png",
        portraitPath: "/assets/enemies/familiar/familiar.png",
        telegraphStyle: "honest",
        abilities: [
            {
                id: "pressure_rush",
                label: "Pressure Rush",
                type: "attack",
                range: "close",
                shownRange: "close",
                damage: 12,
                counterable: true,
                description: "A clear close-range strike that teaches counter timing."
            },
            {
                id: "distant_check",
                label: "Distant Check",
                type: "attack",
                range: "long",
                shownRange: "long",
                damage: 9,
                counterable: false,
                description: "A readable ranged attack that cannot be countered."
            },
            {
                id: "uneasy_glance",
                label: "Uneasy Glance",
                type: "status",
                range: "status",
                shownRange: "status",
                effect: "enemy_damage_up",
                description: "Light status pressure that boosts the next attack."
            }
        ],
        behavior(state) {
            const roll = Math.random();

            if ((state.enemy.nextAttackMultiplier ?? 1) > 1) {
                return withTelegraphMeta(
                    pickAbility(this, roll < 0.55 ? "pressure_rush" : "distant_check")
                );
            }

            if (roll < 0.42) return withTelegraphMeta(pickAbility(this, "pressure_rush"));
            if (roll < 0.82) return withTelegraphMeta(pickAbility(this, "distant_check"));
            return withTelegraphMeta(pickAbility(this, "uneasy_glance"));
        }
    },

    order: {
        id: "order",
        name: "Order",
        hp: 110,
        role: "Anti-Block / Pressure Builder",
        theme: "You cannot just defend. You have to act.",
        spritePath: "/assets/enemies/enforcer/enforcer.png",
        portraitPath: "/assets/enemies/enforcer/enforcer.png",
        telegraphStyle: "honest",
        abilities: [
            {
                id: "quick_strike",
                label: "Quick Strike",
                type: "attack",
                range: "close",
                shownRange: "close",
                damage: 10,
                counterable: true,
                description: "A fast close-range enforcement hit."
            },
            {
                id: "marching_blow",
                label: "Marching Blow",
                type: "attack",
                range: "close",
                shownRange: "close",
                damage: 12,
                counterable: true,
                description: "A steadier close attack that keeps pressure on."
            },
            {
                id: "enforcement_strike",
                label: "Enforcement Strike",
                type: "attack",
                range: "close",
                shownRange: "close",
                damage: 22,
                counterable: true,
                description: "A heavy punish after max pressure is reached."
            }
        ],
        behavior(state) {
            const lastDefense = state.lastResolvedDefense;
            state.lastResolvedDefense = null;

            if (lastDefense === "block") {
                state.enemy.pressure = Math.min(3, (state.enemy.pressure ?? 0) + 1);
            } else if (lastDefense === "counter" || lastDefense === "dodge") {
                state.enemy.pressure = Math.max(0, (state.enemy.pressure ?? 0) - 1);
            }

            if ((state.enemy.pressure ?? 0) >= 3) {
                state.enemy.pressure = 0;
                return withTelegraphMeta(pickAbility(this, "enforcement_strike"));
            }

            return withTelegraphMeta(
                pickAbility(this, Math.random() < 0.58 ? "quick_strike" : "marching_blow")
            );
        }
    },

    watcher: {
        id: "watcher",
        name: "Watcher",
        hp: 100,
        role: "Timing Disruption / Deception",
        theme: "You are being watched and second-guessed.",
        spritePath: "/assets/enemies/watcher/watcher.png",
        portraitPath: "/assets/enemies/watcher/watcher.png",
        telegraphStyle: "deceptive",
        abilities: [
            {
                id: "measured_setup",
                label: "Measured Strike",
                type: "status",
                range: "status",
                shownRange: "close",
                delayed: true,
                effect: "queue_measured_strike",
                description: "The Watcher measures the timing before striking."
            },
            {
                id: "measured_strike",
                label: "Measured Strike",
                type: "attack",
                range: "close",
                shownRange: "close",
                damage: 12,
                counterable: true,
                delayed: true,
                description: "A delayed close hit that tests your timing."
            },
            {
                id: "distant_check",
                label: "Distant Check",
                type: "attack",
                range: "long",
                shownRange: "long",
                damage: 10,
                counterable: false,
                description: "A ranged probe that forces a clean defensive read."
            },
            {
                id: "false_signal",
                label: "False Signal",
                type: "attack",
                range: "long",
                shownRange: "close",
                damage: 10,
                counterable: false,
                fake: true,
                description: "Shows one threat and resolves as another."
            }
        ],
        behavior() {
            const roll = Math.random();

            if (roll < 0.34) {
                return withTelegraphMeta(pickAbility(this, "measured_setup"), {
                    delayed: true
                });
            }

            if (roll < 0.68) {
                return withTelegraphMeta(pickAbility(this, "distant_check"));
            }

            const actual =
                Math.random() < 0.5
                    ? pickAbility(this, "measured_strike")
                    : pickAbility(this, "distant_check");

            return withTelegraphMeta(actual, {
                id: "false_signal",
                label: "False Signal",
                fake: true,
                shownRange: actual.range === "close" ? "long" : "close",
                description: `Shows ${actual.range === "close" ? "long" : "close"} but resolves as ${actual.range}.`
            });
        }
    },

    convergence: {
        id: "convergence",
        name: "Convergence",
        hp: 300,
        role: "Character Switching / System Mastery Boss",
        theme: "You do not get to stay comfortable. You have to adapt.",
        spritePath: "/assets/enemies/boss/boss.png",
        portraitPath: "/assets/enemies/boss/boss.png",
        telegraphStyle: "phase",
        abilities: [
            {
                id: "crushing_blow",
                label: "Crushing Blow",
                type: "attack",
                range: "close",
                shownRange: "close",
                damage: 18,
                counterable: true,
                description: "A direct boss strike."
            },
            {
                id: "core_beam",
                label: "Core Beam",
                type: "attack",
                range: "long",
                shownRange: "long",
                damage: 15,
                counterable: false,
                description: "A ranged boss attack."
            },
            {
                id: "phase_shift",
                label: "Phase Shift",
                type: "status",
                range: "status",
                shownRange: "status",
                effect: "boss_switch_ready",
                description: "Signals an incoming control shift."
            },
            {
                id: "false_signal",
                label: "False Signal",
                type: "attack",
                range: "close",
                shownRange: "long",
                damage: 17,
                counterable: true,
                fake: true,
                description: "The boss disguises a direct threat."
            }
        ],
        behavior(state) {
            const hpPct = state.enemy.hp / state.enemy.maxHp;
            const roll = Math.random();

            if (hpPct > 0.66) {
                if (roll < 0.52) return withTelegraphMeta(pickAbility(this, "crushing_blow"));
                if (roll < 0.9) return withTelegraphMeta(pickAbility(this, "core_beam"));
                return withTelegraphMeta(pickAbility(this, "phase_shift"));
            }

            if (hpPct > 0.33) {
                if (roll < 0.34) return withTelegraphMeta(pickAbility(this, "crushing_blow"));
                if (roll < 0.64) return withTelegraphMeta(pickAbility(this, "core_beam"));
                if (roll < 0.82) return withTelegraphMeta(pickAbility(this, "false_signal"));
                return withTelegraphMeta(pickAbility(this, "phase_shift"));
            }

            if (roll < 0.28) return withTelegraphMeta(pickAbility(this, "crushing_blow"));
            if (roll < 0.52) return withTelegraphMeta(pickAbility(this, "core_beam"));
            if (roll < 0.8) return withTelegraphMeta(pickAbility(this, "false_signal"));
            return withTelegraphMeta(pickAbility(this, "phase_shift"));
        }
    }
};

export const enemyAliases = {
    striker: "familiar",
    breaker: "order",
    controller: "watcher",
    trinity_breaker: "convergence"
};
