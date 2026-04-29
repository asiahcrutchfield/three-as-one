import { applyComboChange, consumeTigerMark, resolveStatusAfterEnemyTurn, applyComboLock, applyComboDelay, applyComboDrain, applyComboBreak, applyTigerMark, applyEnemyDamageMultiplier, applyTimerMultiplier } from './statusEffect.js';

export function resolveEnemyTurn(state) {
    if (state.turn !== "enemy") return { logs: [], effects: [] };

    state.pendingAttacks = state.pendingAttacks || [];

    let intent = state.enemyIntent || {
        type: "attack",
        range: "close",
        damage: 8
    };

    if (intent.type === "fake" && intent.actualAbility) {
        intent = intent.actualAbility;
    }

    const result = {
        logs: [],
        effects: [],
        intentType: intent.type,
        range: intent.range,
        effect: intent.effect,
        playerDamageTaken: 0,
        enemyDamageTaken: 0,
        counterSucceeded: false,
        dodgeSucceeded: false,
        blockSucceeded: false
    };

    if (intent.delayed) {
        state.pendingAttacks.push({ ...intent, delayed: false });
        intent = null;
    }

    let attacksToResolve = [];

    if (intent && intent.type !== "status") {
        attacksToResolve.push(intent);
    }

    attacksToResolve = attacksToResolve.concat(state.pendingAttacks);
    state.pendingAttacks = [];

    let totalDamage = 0;

    attacksToResolve.forEach((attack) => {
        let dmg = attack.damage || 0;

        if (state.tigerMarked && state.player.id === "girl") {
            dmg = Math.floor(dmg * 1.5);
            consumeTigerMark(state);
        }

        const enemyDamageMultiplier = state.enemyDamageMultiplier ?? 1;
        const playerDamageReduction = state.damageReduction || 0;
        
        dmg = Math.floor(dmg * enemyDamageMultiplier);
        dmg = Math.floor(dmg * (1 - playerDamageReduction));
        
        // Reset multiplier after applying to the first attack
        state.enemyDamageMultiplier = 1.0;

        if (state.activeDefense === "dodge") {
            result.dodgeSucceeded = true;
            applyComboChange(state, 0.25);
            dmg = 0;
            state.activeDefense = null;
        }
        else if (state.activeDefense === "block") {
            result.blockSucceeded = true;
            dmg = Math.floor(dmg * 0.5);
            applyComboChange(state, 0.15);
            state.activeDefense = null;
        }
        else if (state.activeDefense === "counter") {
            if (attack.range === "close") {
                result.counterSucceeded = true;

                const counterDamage = Math.floor(10 * state.combo * 1.5);
                result.enemyDamageTaken += counterDamage;

                state.enemy.hp = Math.max(0, Math.min(state.enemy.maxHp, state.enemy.hp - counterDamage));

                applyComboChange(state, 0.5);
                dmg = 0;
            } else {
                applyComboChange(state, -0.5);
            }

            state.activeDefense = null;
        }

        totalDamage += dmg;
    });

    if (totalDamage > 0) {
        if (state.enemy.noDamageNextTurn) {
            totalDamage = 0;
            state.enemy.noDamageNextTurn = false;
        } else {
            if (state.player.id === "girl") {
                state.tiger.hp = Math.max(0, Math.min(state.tiger.maxHp, state.tiger.hp - totalDamage));
            } else {
                state.player.hp = Math.max(0, Math.min(state.player.maxHp, state.player.hp - totalDamage));
            }
            result.playerDamageTaken = totalDamage;

            state.stats = state.stats || {};
            state.stats.heavyDamageTaken = (state.stats.heavyDamageTaken || 0) + 1;
        }
    }

    if (intent && intent.effect) {
        switch (intent.effect) {
            case 'enemy_damage_up':
                applyEnemyDamageMultiplier(state, 1.5);
                break;
            case 'combo_lock':
                applyComboLock(state);
                break;
            case 'combo_delay':
                applyComboDelay(state);
                break;
            case 'combo_drain':
                applyComboDrain(state, 0.5);
                break;
            case 'combo_break':
                applyComboBreak(state);
                break;
            case 'tiger_mark':
                applyTigerMark(state);
                break;
            case 'timer_fast':
                applyTimerMultiplier(state, 0.6);
                break;
            case 'timer_fast_on_hit':
                if (result.playerDamageTaken > 0) {
                    applyTimerMultiplier(state, 0.8);
                }
                break;
        }
    }

    state.activeDefense = null;

    resolveStatusAfterEnemyTurn(state);

    if (state.enemy.hp <= 0) {
        state.status = "Victory";
    } else if (state.player.id === "girl" && state.tiger.hp <= 0) {
        state.meltdown = true;
        state.girlInactive = true;
        const available = ["officer", "man"];
        const newId = available[Math.floor(Math.random() * available.length)];
        state.player.id = newId;
        // TODO: Restore the new character's true HP if inactive HP tracking is implemented
        state.turn = "player";
        state.status = "Player Turn";
        result.logs.push(`Tiger HP reached 0! Meltdown triggered! Switched to ${newId}.`);
    } else if (state.player.id !== "girl" && state.player.hp <= 0) {
        state.status = "Defeat";
    } else {
        state.turn = "player";
        state.status = "Player Turn";
    }

    return result;
}
