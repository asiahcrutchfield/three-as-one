export function playerAttack(state) {
    if (state.turn !== "player") return;

    const damage = Math.floor(10 * state.combo);

    state.enemy.hp = Math.max(0, state.enemy.hp - damage);
    state.combo = Math.min(3, state.combo + 0.25);

    if (state.enemy.hp <= 0) {
        state.status = "Victory";
        return;
    }

    state.turn = "enemy";
    state.status = "Enemy Turn";
}

export function playerBlock(state) {
    if (state.turn !== "player") return;

    state.activeDefense = 'block';

    state.turn = "enemy";
    state.status = "Enemy Turn";
}

export function playerCounter(state) {
    if (state.turn !== "player") return;

    state.activeDefense = 'counter';

    state.turn = "enemy";
    state.status = "Enemy Turn";
}

export function enemyAttack(state) {
    if (state.turn !== "enemy") return { log: [] };

    const intent = state.enemyIntent;
    if (!intent) {
        state.turn = "player";
        state.status = "Player Turn";
        return { damage: 0, type: "none" };
    }

    let rawDamage = intent.damage || 0;
    
    // Apply damage boost
    if (rawDamage > 0 && state.enemyModifiers.damageBoost > 0) {
        rawDamage += state.enemyModifiers.damageBoost;
        // wear it off after 1 attack
        state.enemyModifiers.damageBoost = 0;
    }

    let finalDamage = rawDamage;
    let counterSucceeded = false;
    let playerDamageTaken = 0;
    let enemyDamageTaken = 0;

    if (intent.type === "status") {
        if (intent.effect === "damage_up") {
            state.enemyModifiers.damageBoost = 5; // Flat +5 damage boost
        }
        finalDamage = 0;
    } else if (state.activeDefense === 'block') {
        finalDamage = Math.floor(rawDamage * 0.5);
        state.combo = Math.min(3, state.combo + 0.25);
    } else if (state.activeDefense === 'counter') {
        if (intent.type === "close") {
            // Perfect counter for close attack
            counterSucceeded = true;
            enemyDamageTaken = Math.floor(10 * state.combo * 1.5);
            state.enemy.hp = Math.max(0, state.enemy.hp - enemyDamageTaken);
            state.combo = Math.min(3, state.combo + 0.5);
            finalDamage = 0;
        } else if (intent.type === "long") {
            // Counter fails on long attack
            state.combo = 1.0;
        }
    }

    if (finalDamage > 0) {
        playerDamageTaken = finalDamage;
        state.player.hp = Math.max(0, state.player.hp - finalDamage);
    }

    state.activeDefense = null;
    state.enemyIntent = null; // Clear intent after execution

    if (state.enemy.hp <= 0) {
        state.status = "Victory";
    } else if (state.player.hp <= 0) {
        state.status = "Defeat";
    } else {
        state.turn = "player";
        state.status = "Player Turn";
    }

    return {
        intentId: intent.id,
        intentType: intent.type,
        playerDamageTaken,
        enemyDamageTaken,
        counterSucceeded
    };
}