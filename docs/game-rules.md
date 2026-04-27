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

- Lasts for 2 rounds
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
- Combo gain is slightly increased during meltdown
- Taking heavy damage still reduces combo as normal

### Stabilize (Optional Action)

- Ends meltdown early
- Cost:
  - 15 HP from all allies
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
  - Reduces damage taken by 50%

- Dodge:
  - 30% chance to completely avoid the next attack

- Counter:
  - Successful:
    - Happy: 
      - 1.5x damage
      - +0.5 combo
      - Easier timing window
    - Neutral: 
      - 1.25x damage
      - +0.25 combo
      - Normal timing window
    - Worried: 
      - 1x damage
      - +0.125 combo
      - Harder timing window
    - Sad:
      - 0.75x damage
      - +0.0625 combo
      - Hardest timing window
  - Failed:
    - Reset combo multiplier to x1.0
    - Take 10% extra damage from counter

#### Specials
- Comfort:
  - Heals 25 HP of animal's health
  - Can only be used every other turn

- Tiger's Roar:
  - Causes enemy to skip next turn
  - Base damage: 15
  - Damage changes based on emotion
    - Happy: 20
    - Neutral: 15
    - Worried: 10
    - Sad: 5
  - 1 time use per battle

#### Assists

Active assist:
- Heals active and passive characters
- Effect influenced by emotional state:
  - Happy
    - Active + 20% HP
    - Passive + 10% HP
  - Neutral
    - Active + 15% HP
    - Passive + 7.5% HP
  - Worried
    - Active + 10% HP
    - Passive + 5% HP
  - Sad
    - Active + 5% HP
    - Passive + 2.5% HP
- 3 turn cooldown

Passive assist:
- Inactive characters recover additional HP
  - Happy: +10%
  - Neutral: +7.5%
  - Worried: +5%
  - Sad: +2.5%
  - Meltdown: 0%

#### Stage
Paradise: public/assests/stages/paradise.png

### Officer

### Abilities

Baton Strike:
- Range: close
- Damage: 15
- If enemy is suppressed → +5 damage

Gun Shot:
- Range: long
- Damage: 10
- Reduces enemy damage next turn

#### Offensive moves

Baton Strike:
- Range: close
- Damage: 15
- If enemy is suppressed → +5 damage

Gun Shot:
- Range: long
- Damage: 10
- Reduces enemy damage next turn

#### Defensive moves

Block:
- Reduces damage by 70% (strongest)
- +0.5 combo

Counter:
- Always 1.25x damage (consistent, not risky)
- Smaller reward, safer timing

Dodge:
- Standard timing
- Slightly harder than Girl

#### Specials

Suppress:
- Enemy deals 50% damage next turn
- Lasts 2 turns

Command:
- Next character switch is free
- +1 combo

#### Assists

Active assist:
- Protects active member from next attack
- 3 turn cooldown

Passive assist:
- Reduces damage taken by the active character by 5

#### Stage
Taipei: public/assests/stages/ximending.png

### Man

- If his health gets goes to 25% or below, attack increases by 10%
- If health is below 10%, attack increases by 15%

#### Abilities

#### Offensive moves

Heavy Swing:
- Range: close
- Damage: 30
- High counter risk

Throw Object:
- Range: long
- Damage: 18
- Safe but weaker scaling

#### Defensive moves

Counter:
- 2.0x damage (STRONGEST)
- Hardest timing
- +1 combo

Block:
- Only reduces 40% damage

Dodge:
- Standard timing

#### Specials

Overexert:
- Deals 40 damage
- Takes 15 self-damage

All In:
- Consumes combo
- Damage = 20 × combo
- Resets combo to x1

#### Assists

Active assist:
- Unleashes attack that removes 20% of enemy's current HP. 

Passive assist:
- Increases active character damage by 5%

#### Stage
New Orleans: public/assests/stages/mardi_gras.png

## ENEMIES

### Striker
- Balanced enemy
- Uses both close-range and long-range attacks
- Occasionally uses a status move (small buff or debuff)
- Clearly telegraphs attack type before acting:
  - Close-range → counterable
  - Long-range → cannot be countered
  - Status → indicated before use

---

### Breaker
- Uses fast close-range attacks
- Counters deal reduced damage against it
- Gains **Pressure** when player blocks:
  - +1 Pressure per block
  - At 3 Pressure → next attack deals heavy bonus damage
  - Pressure resets after empowered attack
- Encourages switching between defense types

---

### Disruptor
- Uses status moves frequently
- Applies **Combo Lock**:
  - Combo cannot increase for 1 turn
  - Combo is not reduced
- Has weaker direct damage
- Occasionally applies small combo reduction instead of full disruption

---

### Hunter
- Strong against girl's tiger companion
- Applies **Mark** to the Tiger:
  - Marked Tiger takes increased damage on next attack
- Applies pressure through timing rather than constant damage

---

### Tank
- High HP, low damage
- Above 50% HP:
  - Reduces incoming damage
- Below 50% HP:
  - Loses damage reduction
  - Gains increased attack power
- Shifts from defensive to aggressive mid-fight

---

### Mob
- 1 active enemy
- 1–2 inactive enemies that rotate in every few turns
- Inactive enemies can:
  - Apply buffs to the active enemy
  - Attack inactive characters
    - Can also be attacked by inactive characters
    - Can be targeted by active assists
    - Cannot be attacked by the active character
- Inactive enemies do not directly deal damage
- Rotation order is predictable

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

- Successful counter: +0.5
- Successful dodge: +0.25
- Successful block: +0.25
- Manual switch: +0.5
- Active assist: +0.5
- Fast action (first 50% of timer): +0.25
- Defeating enemy: +1.0

#### Combo Loss

- Failed counter: -1.0
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

### Defensive Moves

- There are 3 kinds of defenses: counter, dodge and block
  - block lowers damage taken by entity from anywhere between 50% - 75%. It needs a cooldown of 1 turn
    - reduces 50–75%
    - +0.5 combo
    - enables stronger next attack 
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
- Small combo loss

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