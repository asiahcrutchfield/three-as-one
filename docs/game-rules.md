## Definitions

Cycle:
A full combat sequence that ends when either the player defeats the enemy or all player characters are defeated.

Turn:
A single action taken by either the player OR the enemy.

Round:
A pair of turns: 
- Player's turn
- Enemy's turn

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

## Characters

### General

- Player controls 3 characters: Girl, Officer, Man

- Only one character is active per cycle

- Each character has 3 abilities

- Inactive characters provide:
  - 1 passive assist (always active)
  - 1 active assist (can be triggered, then goes on cooldown)

- If active character is defeated, the new active character is randomly selected from the remaining characters

### Girl

- Has animal companion that fights and takes damage

- Has 4 emotional states:
  - Happy
  - Neutral
  - Upset
  - Sad

- Animal health changes emotional states
  - 100% -  75% → Happy
  - 74% -  50% → Neutral
  - 49% -  25% → Upset
  - 24% -  min(1, animal HP) → Sad

- If animal reaches 0 HP, girl immediately enters a special meltdown state.
  - Meltdown lasts for 2 rounds
  - She gets switched out randomly with another character
  - Girl is inactive during meltdown
    - Active character actions have a 30% chance to misfire (random attack)
    - Healing of inactive characters is paused
  - "Stabilize" (one-time option during meltdown)
    - Ends meltdown early
    - Costs 20 HP from all allies

- Emotion affects her abilities:
  - Happy → stronger effects
  - Neutral → balanced effects
  - Upset → weaker attack, stronger support
  - Sad → weakest attack, strongest support

### Abilities

- Pounce:
  - Animal attacks the enemy
  - Base damage: 18
  - Damage changes based on emotion
    - Happy: 18  = 24
    - Neutral: 18
    - Upset: 18 = 14
    - Sad: 18 = 10

- Comfort:
  - Heals 25 HP of animal's health
  - Can only be used every other turn

- Encourage:
  - Next action deals 2x effect  
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

- Attack: 15 damage  
- Suppress: Enemy deals 50% damage on its next turn  
- Guard: Reduce damage taken by 50% for the next enemy turn

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

- Attack: 25 damage  
- Overexert: 40 damage, take 15  
- Push Through: Repeat last basic attack only

#### Assists

Active assist:
- Unleashes attack that removes 20% of enemy's current HP. 

Passive assist:
- Increases active character damage by 5%

#### Stage
New Orleans: public/assests/stages/mardi_gras.png

## Enemies

### Blitzer

Attacks every round

### Tank

High HP, low damage

### Charger

- Charges for 2 turns
- On 3rd turn: deals high damage. A random number between 7%-10% of active character's max HP
- Then repeats

### Boss

## Game Flow

1. Start a new cycle
2. Randomly select an active character
3. Repeat:
    a. Player takes an action
    b. Enemy takes an action
4. Until:
    - Enemy is defeated OR
    - All player characters are defeated
5. End the cycle and assign a grade

## Core Mechanics

- Active character is randomly selected at the start of each cycle
    - On game start, characters are randomly selected from all available characters
    - Subsequent random selections are taken from non-defeated, inactive characters

- Only one character is active at a time

- When the active character is defeated, a new one is randomly selected from remaining characters

- Cooldowns are measured in turns

- When a character is defeated, they are removed from the game

- A cycle ends when:
  - Enemy is defeated 
  OR
  - All player characters are defeated

- Each cycle receives a grade (D → S) based on performance

- After any action:
  1. Apply damage/healing
  2. Clamp HP values (no negatives)
  3. Check defeat conditions
  4. Trigger effects (meltdown, death, win/loss)

## Grading

S: won with high HP
A: won cleanly
B: won with struggle
C: barely won
D: lost