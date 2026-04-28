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
    if (state.turn !== "enemy") return;

    let damage = 8;

    if (state.activeDefense === 'block') {
        // Girl reduces 50% damage
        damage = Math.floor(damage * 0.5);
        state.combo = Math.min(3, state.combo + 0.25);
    } else if (state.activeDefense === 'counter') {
        // Perfect counter for Girl: Negate damage, 1.5x return damage, +0.5 combo
        const counterDamage = Math.floor(10 * state.combo * 1.5);
        state.enemy.hp = Math.max(0, state.enemy.hp - counterDamage);
        state.combo = Math.min(3, state.combo + 0.5);
        damage = 0;
    }

    if (damage > 0) {
        state.player.hp = Math.max(0, state.player.hp - damage);
    }

    state.activeDefense = null;

    if (state.enemy.hp <= 0) {
        state.status = "Victory";
        return;
    }

    if (state.player.hp <= 0) {
        state.status = "Defeat";
        return;
    }

    state.turn = "player";
    state.status = "Player Turn";
}