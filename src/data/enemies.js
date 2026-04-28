export const enemies = {
  striker: {
    id: "striker",
    hp: 100,
    type: "balanced",

    behavior: (state) => {
      return Math.random() < 0.5 ? "attack_close" : "attack_range";
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


};