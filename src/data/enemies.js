export const enemies = {
    striker: {
        id: "striker",
        hp: 100,
        type: "balanced",
        
        moves: [
          {
            id: "close_attack",
            label: "Close Attack",
            type: "close",
            damage: 12
          },
          {
            id: "long_attack",
            label: "Long Attack",
            type: "long",
            damage: 8
          },
          {
            id: "status",
            label: "Status",
            type: "status",
            effect: "damage_up"
          }
        ],

        behavior: function() {
            // randomly pick a move
            const move = this.moves[Math.floor(Math.random() * this.moves.length)];
            return move;
        }
    },

    breaker: {
        id: "breaker",
        hp: 120,
        type: "anti_block",

        behavior: () => "attack_close_fast"
    },

    disruptor: {
        id: "disruptor",
        hp: 80,
        type: "combo_control",

        behavior: () => "reduce_combo"
    },

    hunter: {
        id: "hunter",
        hp: 110,
        type: "tiger_pressure",

        behavior: () => "pressure_tiger"
    },

    tank: {
        id: "tank",
        hp: 200,
        type: "slow",

        behavior: () => "defend"
    }
};