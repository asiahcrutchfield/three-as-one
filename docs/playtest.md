# Three as One — Gray Box Test Spec

## Goal

This gray-box test exists to answer one question:

**Is the core battle loop fun when the player is given a random active character and must adapt to the enemy using that character’s tools and assists?**

This test is not meant to prove:
- final story
- final art direction
- final progression
- grading system
- multiple cycle persistence
- final balancing

It is only meant to test:
- moment-to-moment decision making
- clarity of roles
- reaction to enemy intent
- usefulness of assists
- whether a "bad" random character can still create interesting choices

---

## Core Test Pillars

The gray-box should focus on 4 things:

1. **Enemy Intent**
   - The player should always know what the enemy is about to do.
   - The player should feel like they are reacting to a visible threat.

2. **Character Contrast**
   - Each active character should feel immediately different.
   - The player should understand the role of the character within a few seconds.

3. **Assist Value**
   - Assists should feel like the solution to a bad matchup.
   - The player should want to save or spend assists strategically.

4. **Short Tactical Loop**
   - A single battle should be fast.
   - The loop should feel readable, snappy, and replayable.

---

## What the Gray Box Should Include

### 1. One Battle Screen

Only one screen is needed.

It should contain:
- one active player character
- one enemy
- two inactive allies shown as support characters
- visible enemy intent
- visible HP values
- visible assist availability
- action buttons or key prompts

No menus beyond:
- restart
- next test
- return to title (optional)

---

### 2. One Battle = One Test

A single battle should be self-contained.

A battle begins with:
- one randomly chosen active character
- one randomly chosen enemy

A battle ends when:
- enemy HP reaches 0
- OR all player characters are defeated

No grading system needed in the gray-box version.

At most, show:
- Victory
- Defeat
- Battle duration
- Assists used

---

### 3. Enemy Intent System

Before the player acts, the enemy should clearly show what it intends to do next.

Examples:
- **Strike** → basic attack
- **Heavy Strike** → high damage next turn
- **Brace** → increase defense
- **Charge** → preparing strong attack
- **Expose** → becomes vulnerable next turn

The player should always feel:
> "I know what is coming. What is my best response with this character?"

This is the heart of the gray-box test.

---

### 4. Active Character Structure

Only one character is active at a time.

The active character gets:
- 3 abilities
- access to inactive allies’ assists

Each active character should have a simple, readable role.

#### Girl
Role:
- unstable offense/support hybrid

Gameplay feel:
- variable power
- can support or attack
- strongest when the animal is healthy
- weakest when the animal is damaged
- only the animal has health
- the girl has only her emotional state

Gray-box version:
- keep emotion system simplified
- do not use full meltdown yet unless the base loop feels good first

#### Officer
Role:
- control / mitigation

Gameplay feel:
- safest character
- reduces risk
- best at answering dangerous enemy intent

#### Man
Role:
- high damage / risk

Gameplay feel:
- quickest kills
- biggest punish
- least safe

---

### 5. Assists

Assists are one of the main reasons the loop can feel interesting.

Each inactive ally provides:
- one passive effect
- one active assist

In the gray box, active assists should:
- be powerful
- be limited
- have visible cooldowns

Assists should feel like:
> "I didn’t get the right character, but I can still make this work."

That is the fantasy being tested.

---

## What the Gray Box Should NOT Include Yet

To keep the test clean, do not include:

- cycle grading
- multi-cycle progression
- reward systems
- boss fights
- full passive stacking complexity
- multiple forms of hidden randomness
- advanced meltdown consequences
- five enemy types
- multiple background transitions within one battle

The gray-box should feel like a controlled lab test.

---

## Recommended Character Ability Set for Gray Box

### Girl
- **Pounce** → attack based on current animal/emotion state
- **Comfort** → heal animal
- **Encourage** → next action is stronger

### Officer
- **Attack** → moderate damage
- **Suppress** → reduce enemy damage next turn
- **Guard** → reduce incoming damage this round

### Man
- **Attack** → high damage
- **Overexert** → very high damage + self damage
- **Push Through** → enhanced repeat attack or second hit

---

## Recommended Assist Set for Gray Box

### Girl Assist
- heal active character

### Officer Assist
- block or heavily reduce next enemy hit

### Man Assist
- flat burst damage

These should be simple and readable.

Do not use percentage-based enemy HP damage in gray-box unless necessary.

---

## Recommended Enemy Set for Gray Box

Only use 3 enemy types in the first test.

### Blitzer
Purpose:
- fast pressure enemy

Intent examples:
- Strike
- Double Strike

Why:
- tests whether player can survive speed and react quickly

### Tank
Purpose:
- defense / endurance enemy

Intent examples:
- Brace
- Heavy Slam

Why:
- tests whether player can break through defense or pace resources

### Charger
Purpose:
- telegraphed threat enemy

Intent examples:
- Charge
- Charge
- Heavy Strike

Why:
- tests whether the player can prepare correctly for known danger

---

## Functional Requirements

### Battle Start
On battle start:
- randomly choose 1 active character
- randomly choose 1 enemy
- show both immediately
- show enemy intent immediately

### Turn Flow
Each round should follow this order:

1. Show enemy intent
2. Player chooses:
   - one ability
   - or one assist
3. Resolve player action
4. Resolve enemy action
5. Apply end-of-round effects
6. Update enemy intent
7. Repeat

### HP Rules
- HP cannot go below 0
- defeat triggers immediately when HP reaches 0

### Defeat Rules
- Enemy HP = 0 → Victory
- Character HP = 0 → remove character from play
- If active character dies, randomly select new active character from living characters
- If no living characters remain → Defeat

---

## Aesthetic Goals of the Gray Box

The gray-box should not be pretty, but it should be **clear and dramatic**.

### Visual Priority
The player should be able to instantly identify:
- who is active
- who is inactive
- what the enemy is doing
- what their choices are
- which resources are on cooldown

### Layout
Suggested layout:

- Enemy on right
- Active character on the left
- Inactive allies at upper left
- Enemy intent at top center
- HP bars directly under portraits
- Ability buttons at bottom center
- Assist buttons above or beside abilities

### Color Language
Use color only for meaning:
- red = damage / danger
- blue = defense / guard
- green = healing / support
- yellow = buff / assist available
- gray = unavailable / cooldown

### Motion / Feedback
Even in gray-box, include:
- hit flash
- small shake on damage
- floating damage text
- clear cooldown feedback
- brief delay between player action and enemy action

These are required for feel.

---

## Success Criteria

The gray-box test is successful if the player feels:

1. "I understand what the enemy is about to do."
2. "This character feels different from the others."
3. "Assists help me solve bad situations."
4. "Even when I get a bad matchup, I still have interesting choices."
5. "I want to play another battle immediately."

If those five things are not true, the loop is not ready.

---

## Failure Signs

The gray-box test is failing if:
- the player always picks the same action
- enemy turns feel automatic and uninteresting
- active character randomness feels annoying instead of tense
- assists feel optional rather than strategic
- one character always feels bad to get
- battles feel like watching numbers go down

---

## Final Rule for This Test

This gray-box is not trying to prove the full game.

It is trying to prove one fantasy:

**"I got a difficult situation, but I adapted and survived using the tools of three linked characters."**