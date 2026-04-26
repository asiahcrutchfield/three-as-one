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

- If Tiger reaches 0 HP, girl immediately enters a special meltdown state.
  - Meltdown lasts for 2 rounds
  - She gets switched out randomly with another character
  - Girl is inactive during meltdown
    - Active character actions have a 30% chance to misfire (random attack)
    - Healing of inactive characters is paused
  - "Stabilize" (one-time option during meltdown)
    - Ends meltdown early
    - Costs 20 HP from all allies

### Abilities

Offensive moves:
- Pounce:
  - Tiger attacks the enemy
  - Base damage: 18
  - Damage changes based on emotion
    - Happy: 18  = 24
    - Neutral: 18
    - Upset: 18 = 14
    - Sad: 18 = 10

Defensive moves:
- Encourage:
  - Next action deals 2x effect  
  - Can only be used every other turn

Specials:
- Comfort:
  - Heals 25 HP of animal's health
  - Can only be used every other turn

#### Assists

Active assist:
- Heals active member's health by 20%

Passive assist:
- Inactive characters recover an additional 5% HP at the end of each round

#### Stage
Paradise: public/assests/stages/paradise.png

### Officer

### Abilities

Offensive moves:

Defensive moves:

Specials:

#### Assists

Active assist:
- Protects active member from next attack

Passive assist:
- Reduces damage taken by the active character by 5

#### Stage
Taipei: public/assests/stages/ximending.png

### Man

- If his health gets goes to 25% or below, attack increases by 10%
- If health is below 10%, attack increases by 15%

#### Abilities

Offensive moves:

Defensive moves:

Specials:

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

### Breaker
- Uses fast close-range attacks
- Counters deal reduced damage against it
- Deals bonus damage if player blocks repeatedly 

### Disruptor
- Uses status moves frequently
- Can reduce combo or prevent combo gain temporarily
- Has weaker direct damage 

### Hunter
- Targets the Tiger directly
- Deals increased damage to companions
- Causes faster emotional decay

### Tank
- High HP, low damage
- Reduces incoming damage at high HP
- Becomes more aggressive at low HP

### Mob
- 1 active enemy
- 1–2 inactive enemies that rotate in
- Inactive enemies can:
  - buff the active one
  - apply status effects

### Mob
- 1 active enemy
- 1–2 inactive enemies that rotate in
- Inactive enemies can:
  - buff the active one
  - apply status effects

## BATTLES

- At the start of each battle, a random character is chosen to be the active character from the available character roster.
  - remaining characters are inactive
  - on game start, a random character is chose from among all possible characters
  - every following battle, a random character is chosen from the inactive, non-defeated characters
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

### Combos

Combo:
A multiplier that rewards momentum, variety, and successful defensive timing.

- Combo starts at x1.0 at the beginning of each battle
- Combo can increase up to x3.0
- Combo affects damage and healing
- Combo resets to x1.0 when the player makes a major mistake

Combo Gain:
- Successful counter: +0.5
- Correctly timed dodge: +0.25
- Successful defense/block: +0.25
- Manual character switch: +0.5
- Using an active assist: +0.5
- Defeating an enemy: +1.0

Combo Loss:
- Failed counter: reset to x1.0
- Active character is defeated: reset to x1.0
- Meltdown misfire: reset to x1.0
- Taking heavy damage: -0.5

Combo Use:
- Damage = base damage × combo
- Healing = base healing × (1 + ((combo - 1) × 0.25))

Example:
- Combo x1.0 → 25 damage stays 25
- Combo x2.0 → 25 damage becomes 50
- Combo x3.0 → 25 damage becomes 75

### Defensive Moves

- There are 3 kinds of defenses: counter, dodge and block
  - counter allows an entity to negate any damage and return 1.5x - 2x the damage to the attacking entity. It can be performed by properly timing it. If the entity fails a counter then they will receive 1.25x damage
  - block lowers damage taken by entity from anywhere between 50% - 75%. It needs a cooldown of 1 turn
    - reduces 50–75%
    - +0.5 combo
    - enables stronger next attack 
  - dodge allows an entity to evade all damage. It must be properly timed

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

## GRADING

S: won with high HP
A: won cleanly
B: won with struggle
C: barely won
D: lost