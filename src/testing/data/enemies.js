export const enemies = {
  striker: {
    id: "striker",
    name: "Striker",
    hp: 100,
    type: "balanced",

    abilities: [
      {
        id: "close_attack",
        label: "Close Attack",
        type: "attack",
        range: "close",
        damage: 12,
        counterable: true,
        description: "A basic close-range attack."
      },
      {
        id: "long_attack",
        label: "Long Attack",
        type: "attack",
        range: "long",
        damage: 8,
        counterable: false,
        description: "A safer long-range attack."
      },
      {
        id: "focus",
        label: "Focus",
        type: "status",
        range: "status",
        effect: "enemy_damage_up",
        description: "Increases the next enemy attack damage."
      }
    ],

    behavior() {
      const roll = Math.random();

      if (roll < 0.4) return this.abilities.find(a => a.id === "close_attack");
      if (roll < 0.8) return this.abilities.find(a => a.id === "long_attack");
      return this.abilities.find(a => a.id === "focus");
    }
  },

  breaker: {
    id: "breaker",
    name: "Breaker",
    hp: 120,
    type: "anti_block",
    pressure: 0,

    abilities: [
      {
        id: "quick_strike",
        label: "Quick Strike",
        type: "attack",
        range: "close",
        damage: 10,
        counterable: true,
        description: "A fast close-range attack."
      },
      {
        id: "pressure",
        label: "Pressure",
        type: "status",
        range: "status",
        effect: "pressure_up",
        description: "Builds pressure when the player blocks."
      },
      {
        id: "breaker_slam",
        label: "Breaker Slam",
        type: "attack",
        range: "close",
        damage: 22,
        counterable: true,
        effect: "pressure_consume",
        description: "Heavy attack triggered at max pressure."
      }
    ],

    behavior(state) {
      if (state?.lastPlayerAction === "block") {
        this.pressure += 1;
      }

      if (
        state?.lastPlayerAction === "counter" ||
        state?.lastPlayerAction === "dodge"
      ) {
        this.pressure = Math.max(0, this.pressure - 1);
      }

      if (this.pressure >= 3) {
        this.pressure = 0;
        return this.abilities.find(a => a.id === "breaker_slam");
      }

      return this.abilities.find(a => a.id === "quick_strike");
    }
  },

  disruptor: {
    id: "disruptor",
    name: "Disruptor",
    hp: 90,
    type: "combo_control",

    abilities: [
      {
        id: "weak_strike",
        label: "Weak Strike",
        type: "attack",
        range: "close",
        damage: 8,
        counterable: true,
        description: "Weak direct damage."
      },
      {
        id: "combo_lock",
        label: "Combo Lock",
        type: "status",
        range: "status",
        effect: "combo_lock",
        description: "Prevents combo gain for 1 turn."
      },
      {
        id: "combo_delay",
        label: "Combo Delay",
        type: "status",
        range: "status",
        effect: "combo_delay",
        description: "Delays combo gain instead of blocking it."
      },
      {
        id: "combo_drain",
        label: "Combo Drain",
        type: "status",
        range: "status",
        effect: "combo_drain",
        comboLoss: 0.5,
        description: "Reduces combo by 0.5."
      }
    ],

    behavior(state) {
      const roll = Math.random();
      const combo = state?.combo ?? 1;

      if (combo >= 2) {
        if (roll < 0.45) return this.abilities.find(a => a.id === "combo_lock");
        if (roll < 0.8) return this.abilities.find(a => a.id === "combo_drain");
        return this.abilities.find(a => a.id === "weak_strike");
      }

      if (roll < 0.45) return this.abilities.find(a => a.id === "weak_strike");
      if (roll < 0.75) return this.abilities.find(a => a.id === "combo_delay");
      return this.abilities.find(a => a.id === "combo_lock");
    }
  },

  hunter: {
    id: "hunter",
    name: "Hunter",
    hp: 110,
    type: "tiger_pressure",
    tigerMarked: false,

    abilities: [
      {
        id: "mark_tiger",
        label: "Mark Tiger",
        type: "status",
        range: "status",
        effect: "tiger_mark",
        description: "Marks the tiger. The next tiger hit deals increased damage."
      },
      {
        id: "pounce",
        label: "Pounce",
        type: "attack",
        range: "close",
        damage: 12,
        counterable: true,
        target: "active",
        description: "A close attack."
      },
      {
        id: "marked_pounce",
        label: "Marked Pounce",
        type: "attack",
        range: "close",
        damage: 18,
        counterable: true,
        target: "tiger",
        effect: "consume_tiger_mark",
        description: "A stronger attack against a marked tiger."
      },
      {
        id: "emotional_pressure",
        label: "Emotional Pressure",
        type: "status",
        range: "status",
        effect: "emotional_decay",
        description: "Applies pressure to Girl/Tiger emotional state."
      }
    ],

    behavior(state) {
      const activeId = state?.player?.id || state?.activeCharacterId;
      const roll = Math.random();

      if (activeId === "girl") {
        if (!this.tigerMarked && roll < 0.5) {
          this.tigerMarked = true;
          return this.abilities.find(a => a.id === "mark_tiger");
        }

        if (this.tigerMarked) {
          this.tigerMarked = false;
          return this.abilities.find(a => a.id === "marked_pounce");
        }

        if (roll < 0.75) {
          return this.abilities.find(a => a.id === "emotional_pressure");
        }
      }

      return this.abilities.find(a => a.id === "pounce");
    }
  },

  controller: {
    id: "controller",
    name: "Controller",
    hp: 100,
    type: "time_manipulation",
    lastMove: null,

    abilities: [
      {
        id: "snap_strike",
        label: "Snap Strike",
        type: "attack",
        range: "close",
        damage: 12,
        counterable: true,
        effect: "timer_fast_on_hit",
        timerMultiplier: 0.8,
        description: "A fast close-range attack that slightly shortens the next decision timer."
      },
      {
        id: "time_shot",
        label: "Time Shot",
        type: "attack",
        range: "long",
        damage: 10,
        counterable: false,
        description: "A precise long-range attack."
      },
      {
        id: "delay_strike",
        label: "Delay Strike",
        type: "attack",
        range: "close",
        damage: 14,
        counterable: true,
        delayed: true,
        description: "A delayed close-range attack that lands after the player's next action."
      },
      {
        id: "speed_up",
        label: "Speed Up",
        type: "status",
        range: "status",
        effect: "timer_fast",
        timerMultiplier: 0.6,
        description: "Reduces the player's decision timer for 1 turn."
      },
      {
        id: "fake_telegraph",
        label: "Fake Telegraph",
        type: "fake",
        range: "fake",
        description: "Displays one attack type but performs another."
      }
    ],

    behavior() {
      const roll = Math.random();

      if (this.lastMove === "delay_strike") {
        if (roll < 0.5) {
          this.lastMove = "snap_strike";
          return this.abilities.find(a => a.id === "snap_strike");
        }

        this.lastMove = "time_shot";
        return this.abilities.find(a => a.id === "time_shot");
      }

      if (roll < 0.2) {
        this.lastMove = "speed_up";
        return this.abilities.find(a => a.id === "speed_up");
      }

      if (roll < 0.4) {
        const actual =
          Math.random() < 0.5
            ? this.abilities.find(a => a.id === "snap_strike")
            : this.abilities.find(a => a.id === "time_shot");

        this.lastMove = "fake_telegraph";

        return {
          id: "fake_telegraph",
          label: "Fake Telegraph",
          type: "fake",
          range: "fake",
          shownRange: actual.range === "close" ? "long" : "close",
          actualAbility: actual,
          description: `Shows ${actual.range === "close" ? "long" : "close"} but resolves as ${actual.range}.`
        };
      }

      if (roll < 0.65) {
        this.lastMove = "snap_strike";
        return this.abilities.find(a => a.id === "snap_strike");
      }

      if (roll < 0.85) {
        this.lastMove = "time_shot";
        return this.abilities.find(a => a.id === "time_shot");
      }

      this.lastMove = "delay_strike";
      return this.abilities.find(a => a.id === "delay_strike");
    }
  },

  mob: {
    id: "mob",
    name: "Mob",
    hp: 140,
    type: "multi",
    rotationIndex: 0,

    abilities: [
      {
        id: "active_strike",
        label: "Active Strike",
        type: "attack",
        range: "close",
        damage: 10,
        counterable: true,
        description: "The active mob enemy attacks."
      },
      {
        id: "buff_active",
        label: "Buff Active",
        type: "status",
        range: "status",
        effect: "enemy_damage_up",
        description: "Inactive enemy buffs the active enemy."
      },
      {
        id: "harass_inactive",
        label: "Harass Inactive",
        type: "status",
        range: "status",
        effect: "inactive_pressure",
        description: "Inactive enemy pressures inactive characters."
      },
      {
        id: "rotate",
        label: "Rotate",
        type: "status",
        range: "status",
        effect: "mob_rotate",
        description: "Mob rotates the active enemy."
      }
    ],

    behavior() {
      this.rotationIndex++;

      if (this.rotationIndex % 3 === 0) {
        return this.abilities.find(a => a.id === "rotate");
      }

      const roll = Math.random();

      if (roll < 0.45) return this.abilities.find(a => a.id === "active_strike");
      if (roll < 0.75) return this.abilities.find(a => a.id === "buff_active");
      return this.abilities.find(a => a.id === "harass_inactive");
    }
  },

  trinity_breaker: {
    id: "trinity_breaker",
    name: "Trinity Breaker",
    hp: 300,
    type: "boss",
    syncThreshold: 5,
    teamAttackDamage: 75,

    abilities: [
      {
        id: "crushing_blow",
        label: "Crushing Blow",
        type: "attack",
        range: "close",
        damage: 20,
        counterable: true,
        description: "A heavy close-range boss attack."
      },
      {
        id: "core_beam",
        label: "Core Beam",
        type: "attack",
        range: "long",
        damage: 16,
        counterable: false,
        description: "A long-range boss attack."
      },
      {
        id: "delay_break",
        label: "Delay Break",
        type: "attack",
        range: "close",
        damage: 18,
        counterable: true,
        delayed: true,
        description: "A delayed boss strike."
      },
      {
        id: "combo_break",
        label: "Combo Break",
        type: "status",
        range: "status",
        effect: "combo_break",
        description: "Damages the player's combo momentum."
      },
      {
        id: "timer_crush",
        label: "Timer Crush",
        type: "status",
        range: "status",
        effect: "timer_fast",
        timerMultiplier: 0.6,
        description: "Shortens the timer."
      },
      {
        id: "tiger_pressure",
        label: "Tiger Pressure",
        type: "status",
        range: "status",
        effect: "tiger_mark",
        description: "Pressures the Girl/Tiger lane."
      },
      {
        id: "false_signal",
        label: "False Signal",
        type: "fake",
        range: "fake",
        description: "Shows one attack range but resolves as another."
      }
    ],

    behavior(state) {
      const hp = state?.enemy?.hp ?? state?.enemyHp ?? this.hp;

      let directPool;
      let systemPool;

      if (hp > 180) {
        directPool = ["crushing_blow", "core_beam"];
        systemPool = ["combo_break", "tiger_pressure"];
      } else if (hp > 75) {
        directPool = ["crushing_blow", "core_beam", "delay_break"];
        systemPool = ["timer_crush", "combo_break", "tiger_pressure"];
      } else {
        directPool = ["crushing_blow", "core_beam", "delay_break", "false_signal"];
        systemPool = ["timer_crush", "combo_break", "tiger_pressure"];
      }

      const directId = directPool[Math.floor(Math.random() * directPool.length)];
      const systemId = systemPool[Math.floor(Math.random() * systemPool.length)];

      let directThreat = this.abilities.find(a => a.id === directId);

      if (directId === "false_signal") {
        const actual =
          Math.random() < 0.5
            ? this.abilities.find(a => a.id === "crushing_blow")
            : this.abilities.find(a => a.id === "core_beam");

        directThreat = {
          id: "false_signal",
          label: "False Signal",
          type: "fake",
          range: "fake",
          shownRange: actual.range === "close" ? "long" : "close",
          actualAbility: actual,
          description: `Shows ${actual.range === "close" ? "long" : "close"} but resolves as ${actual.range}.`
        };
      }

      const systemThreat = this.abilities.find(a => a.id === systemId);

      return {
        id: "dual_threat",
        label: "Dual Threat",
        type: "multi",
        threats: [directThreat, systemThreat],
        description: "The boss presents one direct threat and one system threat."
      };
    }
  }
};