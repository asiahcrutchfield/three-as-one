# Gameplay

You manage a 3-character team through a short combat run.

Each battle is about reading enemy intent, choosing your risk level, building momentum, and surviving long enough to reach the final boss.

## Core Loop

1. Enemy telegraphs its next action
2. Player chooses one action before the timer ends:
   - Attack
   - Block
   - Dodge
   - Counter
   - Special
   - Assist
   - Switch
3. Action resolves
4. Combo changes based on risk:
   - Attack: steady combo gain
   - Block: safest, slowest combo gain
   - Counter: highest reward, highest risk
   - Timeout / failed counter / failed dodge: combo loss
5. Enemy action resolves
6. Player adapts to HP, combo, tiger state, cooldowns, and switch availability
7. Repeat until victory or defeat

## Run Structure

1. Battle 1 — Striker
   - Teaches close / long / status telegraphs
   - Teaches basic combo momentum

2. Choose Reward
   - HP boost
   - Damage boost
   - Combo boost
   - Timer boost
   - Sync boost

3. Battle 2 — Breaker
   - Punishes repeated blocking
   - Teaches defense variety

4. Choose Reward

5. Battle 3 — Disruptor
   - Attacks combo momentum
   - Teaches recovery after momentum loss

6. Choose Reward

7. Battle 4 — Controller
   - Manipulates the decision timer
   - Teaches time pressure and fast adaptation

8. Choose Reward

9. Battle 5 — Hunter
   - Pressures the Tiger
   - Teaches tiger protection, switching, and meltdown awareness

10. Final Boss — Trinity Breaker
   - Tests all systems
   - Uses multi-threat pressure and Sync Meter

11. Results Screen
   - Score
   - Grade
   - Rewards earned
   - Replay option

## Player Decision Philosophy

The player is not just choosing the “correct” action.

They are choosing tempo:

- Attack = steady momentum
- Block = safe but slower momentum
- Counter = risky but explosive momentum
- Dodge = avoid damage with moderate reward
- Assist = solve bad situations
- Switch = change tools and reset positioning

## Character Roles

### Girl / Tiger
- Adaptive offense and support
- Stronger when Tiger is healthy
- Tiger HP affects Girl’s emotional state
- If Tiger reaches 0 HP, meltdown begins

### Officer
- Control and safety
- Best at reducing danger
- Can slow the timer with Tactical Focus
- Helps the player read and survive dangerous turns

### Man
- High-risk burst damage
- Strongest punish options
- Weakest safety
- Gets stronger at low HP

## Meltdown

Meltdown occurs when Tiger HP reaches 0.

During meltdown:
- Girl becomes inactive
- Player is forced to another character
- Timer pressure increases
- Long-range actions may become unstable
- Passive healing stops
- Player can stabilize at a cost

Meltdown should feel dangerous, but not like instant failure.

## Enemy Progression

### Striker
Basic enemy.
Teaches attack types and defensive responses.

### Breaker
Punishes repeated blocking.
Forces the player to counter, dodge, or switch.

### Disruptor
Attacks combo gain.
Forces the player to rebuild momentum.

### Controller
Manipulates the clock.
Forces faster decisions or lowers combo gain during slowed turns.

### Hunter
Targets the Tiger system.
Forces protection, switching, and emotional-state management.

## Boss Loop — Trinity Breaker

The final boss breaks the normal battle structure.

The fight is split into 3 simultaneous lanes:
- Girl / Tiger lane
- Officer lane
- Man lane

Rules:
- No assists
- No switching
- Each character fights independently
- All lanes contribute to one shared Sync Meter

Each lane presents pressure based on previous enemies:
- Girl lane: Hunter + Disruptor pressure
- Officer lane: Controller pressure
- Man lane: Breaker pressure

## Sync Meter

The Sync Meter builds through strong play:

- Successful counter
- Fast action
- Winning a lane exchange
- Maintaining pressure

The Sync Meter decreases from:
- Failed counters
- Timeouts
- Heavy damage

When full:
- All 3 characters perform a Team Attack
- Team Attack damages the boss core
- Sync resets

## Final Boss Victory

The boss core cannot be damaged normally.

To win:
1. Survive lane pressure
2. Build Sync
3. Trigger Team Attack
4. Repeat until boss core HP reaches 0

## Results

After each battle, show:
- HP bonus
- Combo bonus
- Counter bonus
- Penalties
- Final score
- Rank

Higher ranks give better reward choices.