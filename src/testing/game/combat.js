import { characters } from '../data/characters.js';
import { resolveAttackAbility, resolveDefenseAbility, resolveAssistAbility, getActiveCharacterData } from './charAbilities.js';
import { applyComboChange } from './statusEffect.js';
import { handleVisualEffects } from './visualFeedback.js';

export { applyPassives, handlePlayerTimeout, resolvePlayerAction };

function applyPassives(state) {
    state.damageBonus = 0;
    state.damageReduction = 0;
    
    const activeId = state.player.id;
    const allIds = ["girl", "officer", "man"];
    const inactiveIds = allIds.filter(id => id !== activeId);
    
    const activeChar = characters[activeId];
    if (activeChar && activeChar.passive) {
        state.damageBonus += activeChar.passive(state.player);
    }
    
    inactiveIds.forEach(id => {
        const char = characters[id];
        if (char && char.assist && char.assist.passive) {
            if (char.assist.passive.effect) {
                char.assist.passive.effect(state);
            }
            if (id === "girl" && char.assist.passive.getRegen) {
                const meltdown = state.tiger.hp <= 0;
                const emotion = char.getEmotion(state.tiger.hp, state.tiger.maxHp);
                const regenPct = char.assist.passive.getRegen(emotion, meltdown);
                
                // Assuming it heals the active character for now
                const activeMaxHp = state.player.id === "girl" ? state.tiger.maxHp : state.player.maxHp;
                const healAmt = Math.floor(activeMaxHp * regenPct);
                
                if (healAmt > 0) {
                    if (state.player.id === "girl") {
                        state.tiger.hp = Math.max(0, Math.min(state.tiger.maxHp, state.tiger.hp + healAmt));
                    } else {
                        state.player.hp = Math.max(0, Math.min(state.player.maxHp, state.player.hp + healAmt));
                    }
                }
            }
        }
    });
}

function handlePlayerTimeout(state) {
    if (state.turn !== "player") return null;

    state.stats = state.stats || {};
    state.stats.timeouts = (state.stats.timeouts || 0) + 1;

    applyComboChange(state, -0.5);

    state.activeDefense = null;
    state.turn = "enemy";
    state.status = "Timeout! Enemy Turn";

    return {
        type: "timeout",
        comboLost: 0.5,
        message: "Too slow! -0.5 combo"
    };
}

function resolvePlayerAction(state, category, subcategory, actionName) {
    state.lastPlayerAction = category;
    
    const result = {
        logs: [],
        effects: []
    };
    
    const charData = getActiveCharacterData(state);
    
    if (category === "attack") {
        resolveAttackAbility(state, charData, subcategory, actionName, result);
    } else if (category === "defense") {
        resolveDefenseAbility(state, charData, actionName, result);
    } else if (category === "assist") {
        resolveAssistAbility(state, actionName, result);
    } else if (category === "switch") {
        result.logs.push(`Switched to ${actionName}. Combo +1.0!`);
    }
    
    if (category !== "switch" && category !== "assist") {
        state.turn = "enemy";
        state.status = "Enemy Turn";
    }

    handleVisualEffects(result.effects);
    
    return result;
}