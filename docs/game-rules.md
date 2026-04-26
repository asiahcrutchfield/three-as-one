## Definitions

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

## Characters

### Girl

- Has animal companion that fights and takes damage

- Has 4 emotional states:
  - Happy
  - Neutral
  - Worried
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

### Mob

- Composed of 1 active enemy and 1-2 inactive enemies

### Boss

## Battles

- At the start of each battle, a random character is chosen from the available character roster.
  - on game start, a random character is chose from among all possible characters
  - every following battle, a random character is chosen from the inactive, non-defeated characters
- Every new battle, players have the option of switching out the active character with an inactive, non-defeated character only once.
  - gives +1 combo

### Attacks

- Both enemies and characters have 3 kinds of attacks: close-range, long-range and status
  - close-range moves are stronger
    - counter: yes
    - defend: yes
    - dodge: small window
  - long-range moves are weaker
    - counter: no
    - defend: yes
    - dodge: yes 
  - status moves affect the status of the current character or enemy (healing, defense, attack boost, etc.)

### Combos 

- counter success → +1
- dodge → no gain
- defense → +0.5
- wrong defense → reset

### Defensive Moves

- There are 3 kinds of defenses: counter, dodge and defense
  - counter allows an entity to negate any damage and return 1.5x - 2x the damage to the attacking entity. It can be performed by properly timing it. If the entity fails a counter then they will receive 1.25x damage
  - defense lowers damage taken by entity from anywhere between 50% - 75%. It needs a cooldown of 1 turn
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

## Grading

S: won with high HP
A: won cleanly
B: won with struggle
C: barely won
D: lost