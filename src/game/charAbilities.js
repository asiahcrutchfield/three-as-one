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
    isMeltdownActive,
    getPassiveBonuses,
    healCharacter,
    isCharacterUnavailable
} from "./statusEffect.js";
import { t } from "../i18n.js";

function formatDamage(value) {
    return `${Math.max(0, Math.round(value))}`;
}

function characterName(id) {
    return t(`character.${id}`, characters[id]?.name ?? id);
}

function typeLabel(key) {
    return t(`type.${key}`, key);
}

function cooldownCost(turns) {
    return t("cost.cooldown", `CD ${turns}T`, { value: turns });
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
    const meltdownActive = isMeltdownActive(state);
    const common = {
        girl: [
            {
                id: "girl:pounce",
                label: t("action.pounce"),
                title: t("action.pounce"),
                type: typeLabel("close"),
                damage: formatDamage(getCurrentAttackDamage(state, "girl", "pounce")),
                desc: t("desc.pounce"),
                action: { kind: "attack", characterId: "girl", actionId: "pounce" }
            },
            {
                id: "girl:rockThrow",
                label: t("action.rockThrow"),
                title: t("action.rockThrow"),
                type: typeLabel("long"),
                damage: formatDamage(getCurrentAttackDamage(state, "girl", "rockThrow")),
                desc: meltdownActive
                    ? t("desc.rockThrowMeltdown")
                    : t("desc.rockThrowStable"),
                action: { kind: "attack", characterId: "girl", actionId: "rockThrow" }
            },
            {
                id: "girl:comfort",
                label: t("action.comfort"),
                title: t("action.comfort"),
                type: typeLabel("status"),
                cost: cooldownCost(state.roster.girl.cooldowns.comfort || 3),
                desc: t("desc.comfort"),
                disabled: (state.roster.girl.cooldowns.comfort || 0) > 0,
                action: { kind: "special", characterId: "girl", actionId: "comfort" }
            },
            {
                id: "girl:tigersRoar",
                label: t("action.tigersRoar"),
                title: t("action.tigersRoar"),
                type: typeLabel("special"),
                cost: t("cost.oneBattle"),
                damage: `${Math.round(characters.girl.abilities.special.tigersRoar.getDamagePercent(getGirlEmotion(state)) * 100)}%`,
                desc: t("desc.tigersRoar"),
                disabled: !!state.roster.girl.usedOnce.tigersRoar,
                action: { kind: "special", characterId: "girl", actionId: "tigersRoar" }
            }
        ],
        officer: [
            {
                id: "officer:batonStrike",
                label: t("action.batonStrike"),
                title: t("action.batonStrike"),
                type: typeLabel("close"),
                damage: formatDamage(getCurrentAttackDamage(state, "officer", "batonStrike")),
                desc: t("desc.batonStrike"),
                action: { kind: "attack", characterId: "officer", actionId: "batonStrike" }
            },
            {
                id: "officer:gunShot",
                label: t("action.gunShot"),
                title: t("action.gunShot"),
                type: typeLabel("long"),
                damage: formatDamage(getCurrentAttackDamage(state, "officer", "gunShot")),
                desc: meltdownActive
                    ? t("desc.gunShotMeltdown")
                    : t("desc.gunShotStable"),
                action: { kind: "attack", characterId: "officer", actionId: "gunShot" }
            },
            {
                id: "officer:suppress",
                label: t("action.suppress"),
                title: t("action.suppress"),
                type: typeLabel("status"),
                desc: t("desc.suppress"),
                action: { kind: "special", characterId: "officer", actionId: "suppress" }
            },
            {
                id: "officer:backup",
                label: t("action.backup"),
                title: t("action.backup"),
                type: typeLabel("status"),
                cost: t("cost.oneBattle"),
                desc: t("desc.backup"),
                disabled: !!state.roster.officer.usedOnce.backup,
                action: { kind: "special", characterId: "officer", actionId: "backup" }
            }
        ],
        man: [
            {
                id: "man:heavySwing",
                label: t("action.heavySwing"),
                title: t("action.heavySwing"),
                type: typeLabel("close"),
                damage: formatDamage(getCurrentAttackDamage(state, "man", "heavySwing")),
                desc: t("desc.heavySwing"),
                action: { kind: "attack", characterId: "man", actionId: "heavySwing" }
            },
            {
                id: "man:bottleThrow",
                label: t("action.bottleThrow"),
                title: t("action.bottleThrow"),
                type: typeLabel("long"),
                damage: formatDamage(getCurrentAttackDamage(state, "man", "bottleThrow")),
                desc: t("desc.bottleThrow"),
                action: { kind: "attack", characterId: "man", actionId: "bottleThrow" }
            },
            {
                id: "man:overexert",
                label: t("action.overexert"),
                title: t("action.overexert"),
                type: typeLabel("special"),
                cost: t("cost.selfHp", "15 Self", { value: 15 }),
                damage: "40",
                desc: t("desc.overexert"),
                disabled: getCharacterHp(state, "man") <= 15,
                action: { kind: "special", characterId: "man", actionId: "overexert" }
            },
            {
                id: "man:allIn",
                label: t("action.allIn"),
                title: t("action.allIn"),
                type: typeLabel("special"),
                cost: t("cost.allCombo"),
                damage: formatDamage(18 * Math.min(4, Math.max(1, state.combo))),
                desc: t("desc.allIn"),
                action: { kind: "special", characterId: "man", actionId: "allIn" }
            }
        ]
    };

    const entries = common[characterId] || [];

    if (meltdownActive && characterId !== "girl") {
        entries.push({
            id: `${characterId}:stabilize`,
            label: t("action.stabilize"),
            title: t("action.stabilize"),
            type: typeLabel("status"),
            cost: t("cost.teamHp", "20 Team HP", { value: 20 }),
            desc: t("desc.stabilize"),
            disabled: !canStabilize(state),
            action: { kind: "special", characterId, actionId: "stabilize" }
        });
    }

    return entries;
}

function canStabilize(state) {
    if (!isMeltdownActive(state)) return false;

    const allies = getInactiveCharacterIds(state)
        .concat(state.activeCharacterId)
        .filter((id, index, arr) => arr.indexOf(id) === index)
        .filter((id) => !isCharacterUnavailable(state, id));

    if (!allies.length) return false;

    return allies.every((id) => getCharacterHp(state, id) > 20);
}

function getDefenseEntries(state, characterId) {
    const emotion = characterId === "girl" ? getGirlEmotion(state) : null;
    const girlReduction = emotion ? Math.round(characters.girl.abilities.defense.block.getReduction(emotion) * 100) : 0;

    return [
        {
            id: `${characterId}:block`,
            label: t("action.block"),
            title: t("action.block"),
            type: typeLabel("defense"),
            desc: characterId === "girl"
                ? t("desc.blockGirl", `Reduces incoming damage by ${girlReduction}%.`, { value: girlReduction })
                : t("desc.blockGeneric"),
            action: { kind: "defense", characterId, actionId: "block" }
        },
        {
            id: `${characterId}:dodge`,
            label: t("action.dodge"),
            title: t("action.dodge"),
            type: typeLabel("defense"),
            desc: t("desc.dodge"),
            action: { kind: "defense", characterId, actionId: "dodge" }
        },
        {
            id: `${characterId}:counter`,
            label: t("action.counter"),
            title: t("action.counter"),
            type: typeLabel("defense"),
            desc: t("desc.counter"),
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
                    label: t("action.goodVibes"),
                    title: t("action.goodVibes"),
                    type: typeLabel("assist"),
                    cost: bossAssist?.reason ?? t("cost.oneBoss"),
                    desc: t("desc.goodVibesBoss"),
                    disabled: !bossAssist?.available,
                    action: { kind: "assist", characterId: "girl", actionId: "goodVibesBoss" }
                };
            }

            return {
                id: "assist:girl",
                label: t("action.goodVibes"),
                title: t("action.goodVibes"),
                type: typeLabel("assist"),
                cost: cooldown ? cooldownCost(cooldown) : typeLabel("heal"),
                desc: t("desc.goodVibes"),
                disabled: cooldown > 0,
                action: { kind: "assist", characterId: "girl", actionId: "goodVibes" }
            };
        }

        if (id === "officer") {
            const disabled = state.combo < 1 || state.lastAssistUsed === "officer" || (state.roster.officer.cooldowns.tacticalFocus || 0) > 0;
            const cost = state.combo < 1
                ? t("cost.oneCombo")
                : (state.roster.officer.cooldowns.tacticalFocus || 0) > 0
                    ? cooldownCost(state.roster.officer.cooldowns.tacticalFocus)
                    : t("cost.oneCombo");

            return {
                id: "assist:officer",
                label: t("action.tacticalFocus"),
                title: t("action.tacticalFocus"),
                type: typeLabel("assist"),
                cost,
                desc: state.enemy.id === "convergence"
                    ? t("desc.tacticalFocusBoss")
                    : t("desc.tacticalFocus"),
                disabled: !canUseStandardAssist(state, "officer") || disabled,
                action: { kind: "assist", characterId: "officer", actionId: "tacticalFocus" }
            };
        }

        return {
            id: "assist:man",
            label: t("action.improv"),
            title: t("action.improv"),
            type: typeLabel("assist"),
            damage: "15%",
            desc: state.enemy.id === "convergence"
                ? t("desc.improvBoss")
                : t("desc.improv"),
            disabled: !canUseStandardAssist(state, "man"),
            action: { kind: "assist", characterId: "man", actionId: "improv" }
        };
    });

    return assists.length ? assists : [
        {
            id: "assist:none",
            label: t("action.noAssist"),
            title: t("action.noAssistAvailable"),
            type: typeLabel("assist"),
            desc: t("desc.noAssist"),
            disabled: true,
            action: { kind: "assist", characterId: null, actionId: null }
        }
    ];
}

function getSwitchEntries(state) {
    const switchLocked = state.manualSwitchUsed && !state.freeSwitch;
    const options = getInactiveCharacterIds(state)
        .filter((id) => !isCharacterUnavailable(state, id))
        .map((id) => ({
            id: `switch:${id}`,
            label: characterName(id),
            title: `${t("ui.switch")}: ${characterName(id)}`,
            type: typeLabel("switch"),
            desc: switchLocked
                ? t("desc.switchLocked")
                : state.freeSwitch
                    ? t("desc.switchFree", `Bring ${characterName(id)} in as the active fighter without consuming your battle switch.`, { name: characterName(id) })
                    : t("desc.switchNormal", `Bring ${characterName(id)} in as the active fighter.`, { name: characterName(id) }),
            disabled: switchLocked,
            action: { kind: "switch", characterId: id, actionId: "switch" }
        }));

    return options.length ? options : [
        {
            id: "switch:none",
            label: t("action.noSwitch"),
            title: t("action.noSwitchAvailable"),
            type: typeLabel("switch"),
            desc: t("desc.noSwitch"),
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
    const meltdownActive = isMeltdownActive(state);
    const unstableLongRange = meltdownActive && ["rockThrow", "gunShot"].includes(actionId);

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

    if (unstableLongRange) {
        damage = Math.round(damage * 1.25);
        if (Math.random() < 0.25) {
            feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.unstableMiss") });
            state.lastAttackUsed[characterId] = actionId;
            return feedback;
        }
    }

    const dealt = damageCharacter(state, "enemy", damage);
    if (dealt > 0) {
        feedback.push({ kind: "damage", slotId: "enemy-slot", amount: dealt });
        if (state.enemy.marked && actionId !== "gunShot") state.enemy.marked = false;
    }

    applyComboChange(state, comboGain);
    if (meltdownActive) {
        applyComboChange(state, 0.25);
    }
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
        if (healed > 0) feedback.push({ kind: "heal", slotId: "player-slot", amount: healed, label: t("action.comfort") });
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
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }
        if (dealt > 0) feedback.push({ kind: "damage", slotId: "enemy-slot", amount: dealt });
        return feedback;
    }

    if (characterId === "officer" && actionId === "suppress") {
        state.enemy.nextAttackMultiplier *= 0.5;
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }
        feedback.push({ kind: "defense", slotId: "player-slot", label: t("feedback.suppress") });
        return feedback;
    }

    if (characterId === "officer" && actionId === "backup") {
        state.roster.officer.usedOnce.backup = true;
        state.freeSwitch = true;
        applyComboChange(state, 0.5);
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }
        feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.comboHalf") });
        return feedback;
    }

    if (characterId === "man" && actionId === "overexert") {
        feedback.push({ kind: "attack", slotId: "player-slot", style: "heavy" });
        const enemyDamage = damageCharacter(state, "enemy", 40);
        const selfDamage = damageCharacter(state, "man", 15);
        applyComboChange(state, 0.25);
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }
        if (enemyDamage > 0) feedback.push({ kind: "damage", slotId: "enemy-slot", amount: enemyDamage });
        if (selfDamage > 0) feedback.push({ kind: "damage", slotId: "player-slot", amount: selfDamage });
        return feedback;
    }

    if (characterId === "man" && actionId === "allIn") {
        feedback.push({ kind: "attack", slotId: "player-slot", style: "heavy" });
        const dealt = damageCharacter(state, "enemy", Math.round(18 * Math.min(4, Math.max(1, state.combo))));
        state.combo = 1;
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }
        if (dealt > 0) feedback.push({ kind: "damage", slotId: "enemy-slot", amount: dealt });
        return feedback;
    }

    if (actionId === "stabilize" && canStabilize(state)) {
        ["girl", "officer", "man"].forEach((id) => {
            if (!isCharacterUnavailable(state, id)) {
                damageCharacter(state, id, 20);
            }
        });
        state.meltdown.active = false;
        state.meltdown.roundsRemaining = 0;
        feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.stabilized") });
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
                feedback.push({ kind: "heal", slotId: "player-slot", amount: healed, label: t("feedback.goodVibes") });
            } else {
                feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.goodVibes") });
            }
            feedback.push({ kind: "text", slotId: "enemy-slot", label: t("feedback.switchLocked") });
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
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }

        if (activeHeal > 0) feedback.push({ kind: "heal", slotId: "player-slot", amount: activeHeal, label: t("feedback.goodVibes") });
        if (inactiveHeals.some((value) => value > 0)) {
            feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.teamHealed") });
        }
        state.lastAssistUsed = "girl";
        return feedback;
    }

    if (characterId === "officer") {
        if (!canUseStandardAssist(state, "officer")) {
            feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.assistLocked") });
            return feedback;
        }
        state.combo = Math.max(0, state.combo - 1);
        state.enemy.nextAttackMultiplier *= 0.5;
        if (state.enemy.id === "pull" && (state.enemy.supportStacks ?? 0) > 0) {
            state.enemy.supportStacks = Math.max(0, state.enemy.supportStacks - 1);
            feedback.push({ kind: "text", slotId: "enemy-slot", label: t("feedback.supportBroken") });
        }
        state.roster.officer.cooldowns.tacticalFocus = 1;
        state.lastAssistUsed = "officer";
        applyComboChange(state, 0.5);
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }
        feedback.push({ kind: "defense", slotId: "player-slot", label: t("feedback.focus") });
        return feedback;
    }

    if (!canUseStandardAssist(state, "man")) {
        feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.assistLocked") });
        return feedback;
    }

    if (state.enemy.id === "pull" && ((state.enemy.supportStacks ?? 0) > 0 || (state.enemy.inactiveBodies ?? 0) > 0)) {
        if ((state.enemy.supportStacks ?? 0) > 0) {
            state.enemy.supportStacks = Math.max(0, state.enemy.supportStacks - 1);
        } else {
            state.enemy.inactiveBodies = Math.max(0, state.enemy.inactiveBodies - 1);
        }
        feedback.push({ kind: "text", slotId: "enemy-slot", label: t("feedback.assistHitSupport") });
    }

    const damage = Math.floor(state.enemy.hp * 0.15);
    const dealt = damageCharacter(state, "enemy", damage);
    applyComboChange(state, 0.5);
    if (isMeltdownActive(state)) {
        applyComboChange(state, 0.25);
    }
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
        if (state.manualSwitchUsed && !state.freeSwitch) {
            feedback.push({ kind: "text", slotId: "player-slot", label: t("feedback.switchUsed") });
            return { feedback };
        }
        state.activeCharacterId = action.characterId;
        state.currentDefense = null;
        applyComboChange(state, 1);
        if (!state.freeSwitch) {
            state.manualSwitchUsed = true;
        }
        state.freeSwitch = false;
        if (isMeltdownActive(state)) {
            applyComboChange(state, 0.25);
        }
        feedback.push({
            kind: "text",
            slotId: "player-slot",
            label: t("feedback.switchedTo", `Switched to ${characterName(action.characterId)}`, { name: characterName(action.characterId) })
        });
    }

    if (action.kind === "assist" && action.characterId === "officer") {
        state.playerTurnScale = 1.6;
    }

    return { feedback };
}
