## DEFINITIONS

Battle:
A full combat sequence that ends when either the player defeats the enemy or all player characters are defeated.

Turn:
A single action taken by either the player OR the enemy.

Round:
A pair of turns: 
- Player's turn
- Enemy's turn

Entity:
A character or enemy

### Defeat

Defeat:
An entity (character, enemy, or animal) is defeated when its HP reaches 0.

HP Rules:
- HP cannot go below 0
- After any damage calculation, HP is clamped:
  HP = max(0, HP)

Defeat Handling:
- When HP reaches 0, the entity immediately enters a defeated state
- Defeated entities cannot act or be targeted (unless explicitly allowed)

Defeat Resolution:
- Enemy HP = 0 → Player wins immediately
- Character HP = 0 → Character is removed from play
- Animal HP = 0 → Trigger meltdown, select new active character
- All characters HP = 0 → Game Over
- Character + Enemy HP = 0 simultaneously → Draw

Enemy Defeat:
- When enemy HP reaches 0:
  - Immediately end the cycle
  - Player wins

Character Defeat:
- When a character’s HP reaches 0:
  - Character is removed from play
  - If the defeated character was active:
    - Randomly select a new active character from remaining characters

Animal Defeat:
- When animal HP reaches 0:
  - Trigger meltdown
  - Clamp HP to 0 (cannot go negative)
  - Girl becomes inactive
  - Randomly select a new active character from remaining characters

## CHARACTERS

### Girl

- Has tiger companion that fights and takes damage

- Has 4 emotional states:
  - Happy
  - Neutral
  - Worried
  - Sad

- Tiger health changes emotional states
  - 100% -  75% → Happy
  - 74% -  50% → Neutral
  - 49% -  25% → Worried
  - 24% -  min(1, animal HP) → Sad

- Emotion affects her abilities:
  - Happy → stronger effects
  - Neutral → balanced effects
  - Worried → weaker attack, stronger support
  - Sad → weakest attack, strongest support

## MELTDOWN

Meltdown is triggered when the tiger reaches 0 HP.

### Effects

- Lasts for 3 rounds
- Girl becomes inactive
- Player is forced to switch to another character

### Unstable State

During meltdown:

- Active character gains:
  - +25% damage
  - +0.25 combo on any successful action

- Timing to choose an action becomes shorter

- Actions are **unstable**:
  - Long range actions (gun shot, rock throw) have 25% chance to miss but are stronger
  - Does NOT cause complete action failure

- Passive healing is reduced to 0%

### Combo Interaction

- Combo is NOT reset on meltdown
- Combo gain is slightly reduced during meltdown
- Taking heavy damage still reduces combo as normal

### Stabilize (Optional Action)

- Ends meltdown early
- Cost:
  - 20 HP from all allies
    - If the sum of all allies HP is less than 20 x number of undefeated allies, then stabilize cannot be used
- Removes all unstable effects
- Girl stays inactive

### Abilities

#### Offensive moves
- Pounce:
  - Range: close
  - Tiger attacks the enemy
  - Base damage: 18
  - Damage changes based on emotion
    - Happy: 24
    - Neutral: 18
    - Worried: 14
    - Sad: 10

- Rock Throw:
  - Range: long
  - Girl throws a rock at the enemy
  - Base damage: 12
  - Damage changes based on emotion
    - Happy: 18
    - Neutral: 12
    - Worried: 8
    - Sad: 6

#### Defensive moves
- Block:
  - Tiger protects girl
  - Base: 50% damage reduction
    - Happy: 70%
    - Neutral: 50%
    - Worried: 30%
    - Sad: 20% 

- Dodge:
  - Base: 2.5 seconds
    - Happy: 3 seconds
    - Neutral: 2.5 seconds
    - Worried: 2 seconds
    - Sad: 1.5 seconds

- Counter:
  - Base: 1.25x damage & 2 seconds
  - Successful:
    - Happy: 
      - 1.5x damage
      - +0.5 combo
      - 2.5 seconds
    - Neutral: 
      - 1.25x damage
      - +0.25 combo
      - 2 seconds
    - Worried: 
      - 1x damage
      - +0.125 combo
      - 1.5 seconds
    - Sad:
      - 1.25x damage
      - +0.0625 combo
      - 1 second
  - Failed:
    - Lose 0.5 combo
    - Take +10% damage

#### Specials
- Comfort:
  - Girl hugs tiger
  - Base: heals 25% of tiger's max HP
    - Happy: 30%
    - Neutral: 25%
    - Worried: 20%
    - Sad: 15%
  - 3 turn cooldown

- Tiger's Roar:
  - Enemy deals 0 damage next turn but can still use defensive and status moves
  - Base damage: 15% max HP
  - Emotion bonus stays
    - Happy: +20%
    - Neutral: +15%
    - Worried: +10%
    - Sad: +5%
  - 1 time use per battle

#### Assists

Active assist:
- Name: Good Vibes
- Heals active and passive characters
  - Active character: heal 20% of max hp
  - Inactive character: heal 15% of max hp
- Effect influenced by emotional state:
  - Happy
    - Active character heal + 25%
    - Inactive character heal + 15%
  - Neutral
    - Active character heal + 20%
    - Inactive character heal + 15%
  - Worried
    - Active character heal + 15%
    - Inactive character heal + 10%
  - Sad
    - Active character heal + 10%
    - Inactive character heal + 5%
- 3 turn cooldown

Passive assist:
- Inactive characters recover additional HP
  - Happy: 4%
  - Neutral: 2%
  - Worried: 1.5%
  - Sad: 1%
  - Meltdown: 0%

#### Stage
Paradise: public/assests/stages/paradise.png

### Officer

### Abilities

#### Offensive moves

Baton Strike:
- Range: close
- Damage: 14
- If enemy is suppressed → +6 damage

Gun Shot:
- Range: long
- Damage: 9
- Applies “Marked” instead of damage reduction
  - Marked:
    - Next hit against enemy deals +25% damage
      - If no gun shot on next turn, then marked status is removed
    - Consumed on hit

#### Defensive moves

Block:
- Reduces damage by 70%
- Combo +0.15
- Cannot be used twice in a row

Counter:
- Easier timing window than others
- Damage: 1.1x
- Combo gain: +0.25

Dodge:
- Slightly harder timing than Girl
- Success: no damage +0.25 combo
- Failure: full damage

#### Specials

Suppress:
- Enemy deals 50% damage next turn
- Lasts 1 turn

Backup:
- Next character switch is free
- +0.5 combo
- Once per battle

#### Assists

Active assist:
- Name: Tactical Focus
- Slows the decision timer by 60% for 1 turn
- Player gets more time to react
- Reveals enemy's next action
- Costs: 
  - 1 combo to activate
  - Enemy deals 50% damage next turn
  - Cannot be used twice in a row


Passive assist:
- Name: Tactical Support
- Reduces damage taken by the active character by 3%

#### Stage
Taipei: public/assests/stages/ximending.png

### Man

- HP ≤ 25% → +10% damage
- HP ≤ 10% → +20% damage

#### Abilities

#### Offensive moves

Heavy Swing:
  - Range: close
  - Damage: 18
  - 3-hit chain with input timing
  - Each hit increases risk (ex: press "A" within 0.5s after the previous hit. But can be any random button of [W, A, S, D, ←, →, ↑, ↓])
  - Successful: +0.75 combo
  - Total damage ~30
  - High counter risk

Bottle Throw:
  - Range: long
  - Damage: 12
  - No combo gain
  - Slight delay before hit
  - If used twice in a row → reduced accuracy / damage

#### Defensive moves

Counter:
  - 1.75x damage (instead of 2.0x)
  - Hardest timing
  - +0.75 combo (not +1)

Block:
  - Reduces 40% damage
  - +0.15 combo

Dodge:
  - Slightly harder timing than Officer
  - Standard timing

#### Specials

Overexert:
  - Deals 40 damage
  - Takes 15 self-damage
  - Cannot reduce HP below 1
  - If HP ≤ 15 → cannot be used
  - Grants +0.25 combo (reward aggression)

All In:
  - Consumes all combo
  - Damage = 18 × combo (slightly reduced from 20)
    - Max multiplier: x4
  - Resets combo to x1

#### Assists

Active assist:
  - Name: Improv
  - Removes 15% of enemy CURRENT HP
  - Does not affect bosses
  - No combo gain

Passive assist:
  - Name: Taunt
  - Grants attack boost of 5%

#### Stage
New Orleans: public/assests/stages/mardi_gras.png

## ENEMIES

---

### Familiar

**Role:** Balanced / Tutorial Enemy  
*(Replaces: Striker)*

The Familiar appears calm and non-threatening at first glance, but applies steady pressure through clear and readable attacks.

---

#### Behavior

- Uses both close-range and long-range attacks
- Occasionally uses a light status move
- Clearly telegraphs attack type before acting:
  - Close-range → counterable
  - Long-range → cannot be countered
  - Status → clearly indicated

---

#### Purpose

- Teaches core combat loop:
  - read → decide → act
- Establishes trust in telegraphs
- Introduces player to timing-based defense

---

#### Theme

> Something that feels safe… but isn’t

---

### Order

**Role:** Anti-Block / Pressure Builder  
*(Replaces: Breaker)*

Order enforces structure and punishes overly defensive play. The longer the player relies on blocking, the more dangerous it becomes.

---

#### Pressure Mechanic

- Gains **+1 Pressure** when player blocks
- Loses Pressure when player:
  - counters
  - dodges

At **3 Pressure**:
- Next attack becomes **Enforcement Strike**
- Deals heavy bonus damage
- Pressure resets to 0

---

#### Behavior

- Uses fast close-range attacks
- Applies steady pressure through repetition
- Encourages active, decisive play

---

#### Purpose

- Punishes passive defense
- Forces player to vary defensive choices
- Reinforces risk vs reward

---

#### Theme

> You can’t just defend—you have to act

---

### Watcher

**Role:** Timing Disruption / Deception  
*(Simplified Controller)*

The Watcher observes and manipulates timing, making the player question their reactions and decisions.

---

#### Abilities

- **Measured Strike**
  - Range: close
  - Counterable
  - Slight delay before impact

- **Distant Check**
  - Range: long
  - Cannot be countered
  - Forces defensive decision

- **False Signal**
  - Displays one attack type, but performs another
  - Example:
    - Shows close-range → resolves as long-range
    - Shows long-range → resolves as close-range

---

#### Behavior

- Uses fake telegraphs to disrupt trust
- Introduces slight timing inconsistencies
- Avoids predictable patterns

---

#### Purpose

- Forces player to:
  - think, not just react
  - question telegraphs
- Introduces light mind games without overwhelming complexity

---

#### Theme

> You are being watched—and second-guessed

---

### Pull

**Role:** Multi-Entity / Pressure from Environment  
*(Replaces: Mob)*

The Pull represents external forces that surround and pressure the player over time.

---

#### Structure

- 1 active enemy
- 1–2 inactive enemies rotate in periodically

---

#### Inactive Enemies Can:

- Apply buffs to the active enemy
- Apply pressure to inactive characters
- Be targeted by assists
- Interact with inactive characters

---

#### Restrictions

- Cannot be directly attacked by the active character
- Do not deal direct damage to the active character

---

#### Behavior

- Rotation order is predictable
- Builds pressure through presence rather than direct damage

---

#### Purpose

- Introduces multi-target awareness
- Forces prioritization and planning
- Creates indirect pressure

---

#### Theme

> The environment pulling you back

---

### Convergence (Final Boss)

**Role:** Character Switching / System Mastery Boss  
*(Replaces: Trinity Breaker)*

The Convergence represents the combined pressure affecting all characters.  
Instead of fighting each character in separate lanes, the boss forces the player to manage character switching, cooldowns, timing, and survival.

---

#### Structure

- The player fights the boss directly
- Only one character is active at a time
- The boss can force character switches
- Characters attack the boss directly
- The boss has one shared HP pool

---

#### Boss Switch Mechanic

The boss can force the active character to switch out.

When this happens:

- The current active character becomes inactive
- A different non-defeated character becomes active
- The player must adapt to the new character’s timing, abilities, and risk profile

---

#### Assist Rules

During the final boss:

- Normal assists cannot be used
- Girl does not have an assist during the boss fight
- Girl can still use **Comfort** to heal the tiger
- Girl can use her normal abilities

---

#### Girl Boss Assist Exception

Girl can assist **Officer** or **Man** during the boss fight.

Her boss assist uses her active assist effect:

**Good Vibes**
- Heals the active character
- Can only be used once per boss fight
- After use, the boss gains a **1 boss-switch cooldown**
- This means the boss cannot force another character switch immediately after Good Vibes is used
- Good Vibes cannot be used twice in a row because it is one-time use only

---

#### Boss Switch Cooldown

After Girl uses Good Vibes:

- Boss switch is disabled for 1 boss action
- After that, the boss can switch characters again

---

#### Core Mechanic: Forced Adaptation

The boss tests whether the player can adapt when control changes.

The player must manage:

- Girl / Tiger emotion state
- Officer’s stable defensive tools
- Man’s high-risk offense
- Boss-forced switches
- Limited healing
- Combo momentum

---

#### Phase Behavior

**Phase 1 (High HP):**
- Basic close and long attacks
- Rare boss switch
- Clear telegraphs

**Phase 2 (Mid HP):**
- More frequent boss switching
- Adds timing disruption
- Begins using pressure-style attacks

**Phase 3 (Low HP):**
- Faster decision pressure
- More deceptive telegraphs
- Boss switches become more threatening
- Player must use each character efficiently

---

#### Purpose

- Tests:
  - character mastery
  - adaptability
  - resource management
  - timing under pressure

- Forces:
  - learning all characters
  - surviving bad matchups
  - deciding when to use Girl’s one boss assist
  - staying composed when the boss changes control

---

#### Theme

> You don’t get to stay comfortable.  
> You have to adapt.

## BATTLES

- At the start of each battle, a random character is chosen to be the active character from the available character roster.
  - remaining characters are inactive
  - on game start, a random character is chose from among all possible characters
- Every new battle, players have the option of switching out the active character with an inactive, non-defeated character only once.
  - gives +1 combo

- At the start of each battle, entities:
  - choose 1 move
  OR
  - choose 1 active assist

### Attacks

- Both enemies and characters have 3 categories of attacks: offensive, defensive, special
  - each category has 2 or 3 options
  - *attack:*
    - close-range moves are stronger
      - counter: yes
      - defend: yes
      - dodge: small window
    - long-range moves are weaker
      - counter: no
      - defend: yes
      - dodge: yes
  - *defensive:*
    - counter
    - defense
    - dodge
  - *special:*
    - status: affect the status of the current character or enemy (healing, defense, attack boost, etc.)
    - special move: a special attack specific to that character
      - can only be used once per battle

### COMBO SYSTEM 

#### Core Rules

- Combo starts at x1.0
- Max combo: x3.0

#### Combo Gain

- Successful counter:
  - Perfect: +0.5
  - Good: +0.25

- Successful dodge: +0.25

- Successful block:
  - +0.15 (reduced gain compared to other defensive options)

- Offensive action (attack):
  - Deals damage based on combo multiplier
  - Builds combo at a steady rate (+0.25)
  - Does not mitigate incoming damage

- Manual switch: +0.5
- Active assist: +0.5
- Fast action (first 50% of timer): +0.25
- Defeating enemy: +1.0

#### Combo Loss

- Failed counter: -0.5
- Faild dodge: -0.5
- Heavy damage: -0.5
- Timeout: -0.5
- Active character defeated: reset to x1.0

#### Removed

- No combo reset from meltdown
- No micro values (0.125, 0.0625, etc.)

#### Combo Effects

- Damage:
  - Damage = base × combo

- Healing:
  - Healing = base × (1 + ((combo - 1) × 0.25))

#### Example

- x1.0 → 25 damage → 25
- x2.0 → 25 damage → 50
- x3.0 → 25 damage → 75

#### Momentum Design

The combo system represents combat momentum.

- Offensive actions build momentum steadily
- Defensive actions trade safety for slower momentum growth
- High-risk actions (counters) accelerate momentum significantly

This creates a core decision loop:

- Play safe → survive longer, slower combo growth
- Take risks → faster combo growth, higher reward, higher punishment

The player is not choosing the "correct" action,
but choosing their level of risk and tempo.

### Defensive Moves

- There are 3 kinds of defenses: counter, dodge and block
  - Block:
    - Reduces damage taken by 50%–75% (depends on character)
    - Grants reduced combo gain (+0.15)
    - Does NOT boost next attack
    - Slows overall combo growth compared to offensive or counter play
  - dodge allows an entity to evade all damage. It must be properly timed
  - Counter (see below)

#### COUNTER SYSTEM 

Counter is a timing-based defensive action that negates damage and returns damage to the enemy.

---

### Timing Windows

Each counter has 3 outcomes:

#### Perfect Counter
- Negates all incoming damage
- Deals enhanced counter damage
- Grants full combo bonus

#### Good Counter
- Negates most damage (75%)
- Deals reduced counter damage
- Grants partial combo bonus

#### Failed Counter
- Takes full damage
- No counter damage
- -0.5 combo

---

### Combo Interaction

- Perfect Counter: +0.5 combo
- Good Counter: +0.25 combo
- Failed Counter: -0.5 combo

---

### Counter Rules

- Counter only works against close-range attacks
- Automatically fails against long-range attacks
- Cannot counter status moves

---

### End of Battle Summary

- The end of each battle has displays a summary/
- The summary displays the following information:
  - HP Bonus
  - Combo Bonus
  - Counters
  - Penalties

- Example: 
HP Bonus: +22
Combo Bonus: +15
Counters: +18
Penalties: -10

FINAL SCORE: 145 → S RANK

## CHARACTER DIFFERENCES

---

### Girl (Adaptive Counter)

- Timing window changes based on emotion:

| Emotion | Window Size | Damage Multiplier |
|--------|------------|------------------|
| Happy  | Large      | 1.5x             |
| Neutral| Medium     | 1.25x            |
| Worried| Small      | 1.0x             |
| Sad    | Very Small | 0.75x            |

- Perfect → full reward
- Good → still viable defensive option

---

### Officer (Stable Counter)

- Fixed timing window (medium)
- Consistent results:

  - Perfect:
    - 1.25x damage
    - +0.5 combo

  - Good:
    - 1.0x damage
    - +0.25 combo

- Failed:
  - -0.25 combo
  - No extra damage taken

---

### Man (High-Risk Counter)

- Smallest timing window

- Perfect:
  - 2.0x damage
  - +1.0 combo

- Good:
  - 1.25x damage
  - +0.25 combo

- Failed:
  - Takes +10% damage
  - -0.75 combo

---

### Additional Rules

- Counter timing is consistent per character
- Visual/audio cues indicate timing window
- Enemy telegraphs must align with counter timing

---

## DESIGN PRINCIPLES

- Counter should feel learnable, not random
- Failure should punish, but not reset progress entirely
- Each character expresses a different risk/reward profile

Counter vs long-range:
→ fails automatically

Dodge vs close-range:
→ harder timing

Defense vs status:
→ only valid option

### Timed Turns

Timed Turn:
Each active entity has a limited amount of time to choose an action.

Player Turn Timer:
- Player has 7 seconds to choose an action
- If the timer reaches 0, the player’s turn is skipped
- Skipped turn does not gain combo
- Skipped turn reduces combo by 0.5

Enemy Turn Timer:
- Enemies also act after a short delay
- Some enemies have faster or slower action timers

Timer Effects:
- Successful action before timer expires → normal result
- Action chosen quickly → optional small combo bonus
- Timeout → turn skipped

Combo Interaction:
- Action chosen within first 50% of timer → +0.25 combo
- Timeout → -0.5 combo

## GRADING SYSTEM

Grading is based on player performance during a battle. Grades determine reward options that can be taken into the next battle. The higher the grade, the better the reward options. 

### Score Calculation

Start with base score: 100

---

### Bonuses

- Remaining HP:
  +0 to +30 points
  (based on % of total team HP remaining)

- Max Combo Reached:
  +0 to +20 points
  (higher combo = higher reward)

- Successful Counters:
  +2 points per Perfect Counter
  +1 point per Good Counter

- Fast Actions:
  +1 point per action chosen in first 50% of timer

---

### Penalties

- Heavy Damage Taken:
  -1 point per instance

- Failed Counters:
  -2 points each

- Timeout (missed turn):
  -5 points each

- Character Defeated:
  -10 points each

---

### Final Grade

- S Rank: 130+ points
- A Rank: 110–129 points
- B Rank: 90–109 points
- C Rank: 70–89 points
- D Rank: below 70 or defeat

---

### Reward System

- Rewards:
  - HP bonus
  - Combo bonus
  - Counter bonus
  - Fast action bonus
- Reward Options:
  - Only one option can be chosen
    - S Rank: All options available
    - A Rank: Choose from 3 options
    - B Rank: Choose from 2 options
    - C Rank: Choose from 1 option
    - D Rank: No options available

### Design Notes

- Rewards aggressive, skillful play
- Encourages use of combo and counter systems
- Penalizes passive or slow decisions