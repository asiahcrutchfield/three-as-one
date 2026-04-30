import { characters } from "../data/characters.js";
import { canUseStandardAssist, getBossAssistEntryState, useConvergenceGoodVibes } from "./convergence.js";
import {
    applyComboChange,
    damageCharacter,
    getCharacterHp,
    getCharacterMaxHp,
    getGirlEmotion,
    getInactiveAssistIds,
    getInactiveCharacterIds,
    getPassiveBonuses,
    healCharacter,
    isCharacterUnavailable
} from "./statusEffect.js";

function formatDamage(value) {
    return `${Math.max(0, Math.round(value))}`;
}

function getBaseAttackDamage(state, characterId, attackId) {
    const character = characters[characterId];

    if (characterId === "girl") {
        const emotion = getGirlEmotion(state);
        if (attackId === "pounce") return character.abilities.attack.pounce.getDamage(emotion);
        if (attackId === "rockThrow") return character.abilities.attack.rockThrow.getDamage(emotion);
    }

    if (characterId === "officer") {
        if (attackId === "batonStrike") return character.abilities.attack.batonStrike.base;
        if (attackId === "gunShot") return character.abilities.attack.gunShot.damage;
    }

    if (characterId === "man") {
        if (attackId === "heavySwing") return 30;
        if (attackId === "bottleThrow") return character.abilities.attack.bottleThrow.damage;
    }

    return 0;
}

function getCurrentAttackDamage(state, characterId, attackId) {
    let damage = getBaseAttackDamage(state, characterId, attackId);
    const passives = getPassiveBonuses(state);

    damage *= state.combo;
    damage *= 1 + passives.damageBonus;

    if (state.enemy.marked) damage *= 1.25;

    if (characterId === "officer" && attackId === "batonStrike" && state.enemy.nextAttackMultiplier < 1) {
        damage += characters.officer.abilities.attack.batonStrike.bonusIfSuppressed;
    }

    if (characterId === "man" && attackId === "bottleThrow" && state.lastAttackUsed.man === "bottleThrow") {
        damage *= 0.8;
    }

    return Math.max(1, Math.round(damage));
}

function getAttackEntries(state, characterId) {
    const common = {
        girl: [
            {
                id: "girl:pounce",
                label: "Pounce",
                title: "Pounce",
                type: "Close",
                damage: formatDamage(getCurrentAttackDamage(state, "girl", "pounce")),
                desc: "Tiger lunges in for the strongest close hit.",
                action: { kind: "attack", characterId: "girl", actionId: "pounce" }
            },
            {
                id: "girl:rockThrow",
                label: "Rock Throw",
                title: "Rock Throw",
                type: "Long",
                damage: formatDamage(getCurrentAttackDamage(state, "girl", "rockThrow")),
                desc: "Safer ranged pressure with lighter damage.",
                action: { kind: "attack", characterId: "girl", actionId: "rockThrow" }
            },
            {
                id: "girl:comfort",
                label: "Comfort",
                title: "Comfort",
                type: "Status",
                cost: state.roster.girl.cooldowns.comfort ? `CD ${state.roster.girl.cooldowns.comfort}T` : "CD 3T",
                desc: "Heals Tiger based on Girl's current mood.",
                disabled: (state.roster.girl.cooldowns.comfort || 0) > 0,
                action: { kind: "special", characterId: "girl", actionId: "comfort" }
            },
            {
                id: "girl:tigersRoar",
                label: "Tiger's Roar",
                title: "Tiger's Roar",
                type: "Special",
                cost: "1/Battle",
                damage: `${Math.round(characters.girl.abilities.special.tigersRoar.getDamagePercent(getGirlEmotion(state)) * 100)}%`,
                desc: "Deals burst damage and nullifies the next enemy attack.",
                disabled: !!state.roster.girl.usedOnce.tigersRoar,
                action: { kind: "special", characterId: "girl", actionId: "tigersRoar" }
            }
        ],
        officer: [
            {
                id: "officer:batonStrike",
                label: "Baton Strike",
                title: "Baton Strike",
                type: "Close",
                damage: formatDamage(getCurrentAttackDamage(state, "officer", "batonStrike")),
                desc: "Reliable close hit that punishes a suppressed enemy.",
                action: { kind: "attack", characterId: "officer", actionId: "batonStrike" }
            },
            {
                id: "officer:gunShot",
                label: "Gun Shot",
                title: "Gun Shot",
                type: "Long",
                damage: formatDamage(getCurrentAttackDamage(state, "officer", "gunShot")),
                desc: "Deals damage and marks the enemy for the next hit.",
                action: { kind: "attack", characterId: "officer", actionId: "gunShot" }
            },
            {
                id: "officer:suppress",
                label: "Suppress",
                title: "Suppress",
                type: "Status",
                desc: "Cuts the enemy's next attack damage in half.",
                action: { kind: "special", characterId: "officer", actionId: "suppress" }
            },
            {
                id: "officer:backup",
                label: "Backup",
                title: "Backup",
                type: "Status",
                cost: "1/Battle",
                desc: "Grants combo and primes the next switch.",
                disabled: !!state.roster.officer.usedOnce.backup,
                action: { kind: "special", characterId: "officer", actionId: "backup" }
            }
        ],
        man: [
            {
                id: "man:heavySwing",
                label: "Heavy Swing",
                title: "Heavy Swing",
                type: "Close",
                damage: formatDamage(getCurrentAttackDamage(state, "man", "heavySwing")),
                desc: "Big three-hit offense with strong combo gain.",
                action: { kind: "attack", characterId: "man", actionId: "heavySwing" }
            },
            {
                id: "man:bottleThrow",
                label: "Bottle Throw",
                title: "Bottle Throw",
                type: "Long",
                damage: formatDamage(getCurrentAttackDamage(state, "man", "bottleThrow")),
                desc: "Safer ranged hit that loses edge if repeated.",
                action: { kind: "attack", characterId: "man", actionId: "bottleThrow" }
            },
            {
                id: "man:overexert",
                label: "Overexert",
                title: "Overexert",
                type: "Special",
                cost: "15 Self",
                damage: "40",
                desc: "Heavy burst that leaves Man hurt but standing.",
                disabled: getCharacterHp(state, "man") <= 15,
                action: { kind: "special", characterId: "man", actionId: "overexert" }
            },
            {
                id: "man:allIn",
                label: "All In",
                title: "All In",
                type: "Special",
                cost: "All Combo",
                damage: formatDamage(18 * Math.min(4, Math.max(1, state.combo))),
                desc: "Cashes out your momentum for one huge strike.",
                action: { kind: "special", characterId: "man", actionId: "allIn" }
            }
        ]
    };

    return common[characterId] || [];
}

function getDefenseEntries(state, characterId) {
    const emotion = characterId === "girl" ? getGirlEmotion(state) : null;
    const girlReduction = emotion ? Math.round(characters.girl.abilities.defense.block.getReduction(emotion) * 100) : 0;

    return [
        {
            id: `${characterId}:block`,
            label: "Block",
            title: "Block",
            type: "Defense",
            desc: characterId === "girl"
                ? `Reduces incoming damage by ${girlReduction}%.`
                : "Safest defense. Reduces damage and gains modest combo.",
            action: { kind: "defense", characterId, actionId: "block" }
        },
        {
            id: `${characterId}:dodge`,
            label: "Dodge",
            title: "Dodge",
            type: "Defense",
            desc: "Avoids direct attacks entirely in this prototype pass.",
            action: { kind: "defense", characterId, actionId: "dodge" }
        },
        {
            id: `${characterId}:counter`,
            label: "Counter",
            title: "Counter",
            type: "Defense",
            desc: "Stops close attacks and hits back. Fails on long or status moves.",
            action: { kind: "defense", characterId, actionId: "counter" }
        }
    ];
}

function getAssistEntries(state) {
    const assists = getInactiveAssistIds(state).map((id) => {
        const character = characters[id];

        if (id === "girl") {
            const cooldown = state.roster.girl.cooldowns.goodVibes || 0;
            const bossAssist = getBossAssistEntryState(state);

            if (state.enemy.id === "convergence") {
                return {
                    id: "assist:girl",
                    label: "Good Vibes",
                    title: "Good Vibes",
                    type: "Assist",
                    cost: bossAssist?.reason ?? "1/Boss",
                    desc: "Boss-only heal for the active fighter. Prevents the next forced switch.",
                    disabled: !bossAssist?.available,
                    action: { kind: "assist", characterId: "girl", actionId: "goodVibesBoss" }
                };
            }

            return {
                id: "assist:girl",
                label: "Good Vibes",
                title: "Good Vibes",
                type: "Assist",
                cost: cooldown ? `CD ${cooldown}T` : "Heal",
                desc: "Heals the active fighter and both bench characters.",
                disabled: cooldown > 0,
                action: { kind: "assist", characterId: "girl", actionId: "goodVibes" }
            };
        }

        if (id === "officer") {
            const disabled = state.combo < 1 || state.lastAssistUsed === "officer" || (state.roster.officer.cooldowns.tacticalFocus || 0) > 0;
            const cost = state.combo < 1
                ? "1 Combo"
                : (state.roster.officer.cooldowns.tacticalFocus || 0) > 0
                    ? `CD ${state.roster.officer.cooldowns.tacticalFocus}T`
                    : "1 Combo";

            return {
                id: "assist:officer",
                label: character.assist.active.name,
                title: character.assist.active.name,
                type: "Assist",
                cost,
                desc: state.enemy.id === "convergence"
                    ? "Disabled during the boss fight."
                    : "Spends combo to soften the enemy's next attack.",
                disabled: !canUseStandardAssist(state, "officer") || disabled,
                action: { kind: "assist", characterId: "officer", actionId: "tacticalFocus" }
            };
        }

        return {
            id: "assist:man",
            label: character.assist.active.name,
            title: character.assist.active.name,
            type: "Assist",
            damage: "15%",
            desc: state.enemy.id === "convergence"
                ? "Disabled during the boss fight."
                : "Shaves off a chunk of the enemy's current HP.",
            disabled: !canUseStandardAssist(state, "man"),
            action: { kind: "assist", characterId: "man", actionId: "improv" }
        };
    });

    return assists.length ? assists : [
        {
            id: "assist:none",
            label: "No Assist",
            title: "No Assist Available",
            type: "Assist",
            desc: "No active assists are currently available.",
            disabled: true,
            action: { kind: "assist", characterId: null, actionId: null }
        }
    ];
}

function getSwitchEntries(state) {
    const options = getInactiveCharacterIds(state)
        .filter((id) => !isCharacterUnavailable(state, id))
        .map((id) => ({
            id: `switch:${id}`,
            label: characters[id].name,
            title: `Switch: ${characters[id].name}`,
            type: "Switch",
            desc: `Bring ${characters[id].name} in as the active fighter.`,
            action: { kind: "switch", characterId: id, actionId: "switch" }
        }));

    return options.length ? options : [
        {
            id: "switch:none",
            label: "No Switch",
            title: "No Switch Available",
            type: "Switch",
            desc: "There are no healthy inactive characters to switch to.",
            disabled: true,
            action: { kind: "switch", characterId: null, actionId: null }
        }
    ];
}

export function buildActionMenuData(state) {
    const activeId = state.activeCharacterId;

    return {
        attack: getAttackEntries(state, activeId),
        defend: getDefenseEntries(state, activeId),
        assist: getAssistEntries(state),
        switch: getSwitchEntries(state)
    };
}

function resolveAttack(state, characterId, actionId) {
    const feedback = [];
    let damage = getCurrentAttackDamage(state, characterId, actionId);
    let comboGain = 0.25;

    const motionStyle = actionId === "pounce" || (characterId === "girl" && actionId === "rockThrow")
        ? "pounce"
        : actionId === "heavySwing"
        ? "heavy"
        : (actionId === "rockThrow" || actionId === "gunShot" || actionId === "bottleThrow")
            ? "ranged"
            : "melee";

    const motionTargetCharacterId = characterId === "girl"
        ? (actionId === "rockThrow" ? "girl" : "tiger")
        : null;

    feedback.push({
        kind: "attack",
        slotId: "player-slot",
        style: motionStyle,
        targetCharacterId: motionTargetCharacterId
    });

    if (characterId === "man" && actionId === "heavySwing") comboGain = 0.75;
    if (characterId === "man" && actionId === "bottleThrow") comboGain = 0;

    if (characterId === "officer" && actionId === "gunShot") {
        state.enemy.marked = true;
    }

    const dealt = damageCharacter(state, "enemy", damage);
    if (dealt > 0) {
        feedback.push({ kind: "damage", slotId: "enemy-slot", amount: dealt });
        if (state.enemy.marked && actionId !== "gunShot") state.enemy.marked = false;
    }

    applyComboChange(state, comboGain);
    state.lastAttackUsed[characterId] = actionId;

    return feedback;
}

function resolveSpecial(state, characterId, actionId) {
    const feedback = [];

    if (characterId === "girl" && actionId === "comfort") {
        const emotion = getGirlEmotion(state);
        const healPct = characters.girl.abilities.special.comfort.getHealPercent(emotion);
        const healed = healCharacter(state, "girl", Math.floor(state.tiger.maxHp * healPct));
        state.roster.girl.cooldowns.comfort = 3;
        if (healed > 0) feedback.push({ kind: "heal", slotId: "player-slot", amount: healed, label: "Comfort" });
        return feedback;
    }

    if (characterId === "girl" && actionId === "tigersRoar") {
        const emotion = getGirlEmotion(state);
        const damagePct = characters.girl.abilities.special.tigersRoar.getDamagePercent(emotion);
        feedback.push({
            kind: "attack",
            slotId: "player-slot",
            style: "roar",
            targetCharacterId: "tiger"
        });
        const dealt = damageCharacter(state, "enemy", Math.floor(state.enemy.maxHp * damagePct));
        state.enemy.noDamageNextTurn = true;
        state.roster.girl.usedOnce.tigersRoar = true;
        if (dealt > 0) feedback.push({ kind: "damage", slotId: "enemy-slot", amount: dealt });
        return feedback;
    }

    if (characterId === "officer" && actionId === "suppress") {
        state.enemy.nextAttackMultiplier *= 0.5;
        feedback.push({ kind: "defense", slotId: "player-slot", label: "Suppress" });
        return feedback;
    }

    if (characterId === "officer" && actionId === "backup") {
        state.roster.officer.usedOnce.backup = true;
        state.freeSwitch = true;
        applyComboChange(state, 0.5);
        feedback.push({ kind: "text", slotId: "player-slot", label: "+0.5 Combo" });
        return feedback;
    }

    if (characterId === "man" && actionId === "overexert") {
        feedback.push({ kind: "attack", slotId: "player-slot", style: "heavy" });
        const enemyDamage = damageCharacter(state, "enemy", 40);
        const selfDamage = damageCharacter(state, "man", 15);
        applyComboChange(state, 0.25);
        if (enemyDamage > 0) feedback.push({ kind: "damage", slotId: "enemy-slot", amount: enemyDamage });
        if (selfDamage > 0) feedback.push({ kind: "damage", slotId: "player-slot", amount: selfDamage });
        return feedback;
    }

    if (characterId === "man" && actionId === "allIn") {
        feedback.push({ kind: "attack", slotId: "player-slot", style: "heavy" });
        const dealt = damageCharacter(state, "enemy", Math.round(18 * Math.min(4, Math.max(1, state.combo))));
        state.combo = 1;
        if (dealt > 0) feedback.push({ kind: "damage", slotId: "enemy-slot", amount: dealt });
        return feedback;
    }

    return feedback;
}

function resolveAssist(state, characterId) {
    const feedback = [];

    if (characterId === "girl") {
        if (state.enemy.id === "convergence" && state.activeCharacterId !== "girl") {
            const healed = useConvergenceGoodVibes(state);
            state.lastAssistUsed = "girl";
            if (healed > 0) {
                feedback.push({ kind: "heal", slotId: "player-slot", amount: healed, label: "Good Vibes" });
            } else {
                feedback.push({ kind: "text", slotId: "player-slot", label: "Good Vibes" });
            }
            feedback.push({ kind: "text", slotId: "enemy-slot", label: "Switch Locked" });
            return feedback;
        }

        const emotion = getGirlEmotion(state);
        const values = characters.girl.assist.active.getValues(emotion);
        const activeHeal = healCharacter(state, state.activeCharacterId, Math.floor(getCharacterMaxHp(state, state.activeCharacterId) * values.active));
        const inactiveHeals = getInactiveCharacterIds(state)
            .filter((id) => !isCharacterUnavailable(state, id))
            .map((id) => healCharacter(state, id, Math.floor(getCharacterMaxHp(state, id) * values.inactive)));

        state.roster.girl.cooldowns.goodVibes = 3;
        applyComboChange(state, 0.5);

        if (activeHeal > 0) feedback.push({ kind: "heal", slotId: "player-slot", amount: activeHeal, label: "Good Vibes" });
        if (inactiveHeals.some((value) => value > 0)) {
            feedback.push({ kind: "text", slotId: "player-slot", label: "Team Healed" });
        }
        state.lastAssistUsed = "girl";
        return feedback;
    }

    if (characterId === "officer") {
        if (!canUseStandardAssist(state, "officer")) {
            feedback.push({ kind: "text", slotId: "player-slot", label: "Assist Locked" });
            return feedback;
        }
        state.combo = Math.max(0, state.combo - 1);
        state.enemy.nextAttackMultiplier *= 0.5;
        if (state.enemy.id === "pull" && (state.enemy.supportStacks ?? 0) > 0) {
            state.enemy.supportStacks = Math.max(0, state.enemy.supportStacks - 1);
            feedback.push({ kind: "text", slotId: "enemy-slot", label: "Support Broken" });
        }
        state.roster.officer.cooldowns.tacticalFocus = 1;
        state.lastAssistUsed = "officer";
        applyComboChange(state, 0.5);
        feedback.push({ kind: "defense", slotId: "player-slot", label: "Focus" });
        return feedback;
    }

    if (!canUseStandardAssist(state, "man")) {
        feedback.push({ kind: "text", slotId: "player-slot", label: "Assist Locked" });
        return feedback;
    }

    if (state.enemy.id === "pull" && ((state.enemy.supportStacks ?? 0) > 0 || (state.enemy.inactiveBodies ?? 0) > 0)) {
        if ((state.enemy.supportStacks ?? 0) > 0) {
            state.enemy.supportStacks = Math.max(0, state.enemy.supportStacks - 1);
        } else {
            state.enemy.inactiveBodies = Math.max(0, state.enemy.inactiveBodies - 1);
        }
        feedback.push({ kind: "text", slotId: "enemy-slot", label: "Assist Hit Support" });
    }

    const damage = Math.floor(state.enemy.hp * 0.15);
    const dealt = damageCharacter(state, "enemy", damage);
    applyComboChange(state, 0.5);
    state.lastAssistUsed = "man";
    if (dealt > 0) feedback.push({ kind: "damage", slotId: "enemy-slot", amount: dealt });
    return feedback;
}

export function resolvePlayerAction(state, item) {
    const action = item?.action;
    if (!action) return { feedback: [] };

    const feedback = [];

    if (action.kind === "attack") {
        feedback.push(...resolveAttack(state, action.characterId, action.actionId));
    } else if (action.kind === "special") {
        feedback.push(...resolveSpecial(state, action.characterId, action.actionId));
    } else if (action.kind === "defense") {
        state.currentDefense = action.actionId;
    } else if (action.kind === "assist") {
        feedback.push(...resolveAssist(state, action.characterId));
    } else if (action.kind === "switch") {
        state.activeCharacterId = action.characterId;
        state.currentDefense = null;
        applyComboChange(state, state.freeSwitch ? 0 : 0.5);
        state.freeSwitch = false;
        feedback.push({ kind: "text", slotId: "player-slot", label: `Switched to ${characters[action.characterId].name}` });
    }

    if (action.kind === "assist" && action.characterId === "officer") {
        state.playerTurnScale = 1.6;
    }

    return { feedback };
}
