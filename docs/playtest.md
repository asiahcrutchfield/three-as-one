# Three as One — Updated Playtest Spec (Combat-Active Version)

## Goal

This playtest exists to answer one question:

**Is the core battle loop fun when enemies actively pressure the player with real attacks, timing disruption, and decision-making under a timer?**

This test focuses on:
- reacting to enemy telegraph
- defending against real damage
- decision-making under a timer
- combo as momentum
- block vs dodge vs counter decisions
- character identity
- enemy identity

This test is NOT meant to validate:
- final boss multi-lane system
- full progression balancing
- reward tuning
- perfect numbers

---

## Core Test Pillars

### 1. Enemy Intent Clarity
- Player must understand what the enemy is about to do
- Telegraph must match:
  - close attack (counterable)
  - long attack (not counterable)
  - delayed attack
  - fake telegraph (intentional deception)

---

### 2. Real Threat (NEW — CRITICAL)

Enemies must:
- deal actual damage
- force defensive decisions
- punish wrong choices

Player should NOT be able to:
- spam attack safely
- ignore enemy behavior

Goal:
- Player feels:
  > “I need to respond or I will get punished”

---

### 3. Time Pressure

- Each turn has a visible countdown timer (~7 seconds)

Rules:
- Fast action (first half of timer):
  → +0.25 combo
- Timeout:
  - Player turn is skipped
  - No combo gain
  - Combo -0.5
  - Counts as a Timeout penalty in battle summary
  - Enemy acts normally after timeout

Goal:
- Player feels urgency, not confusion

---

### 4. Defensive System (Block / Dodge / Counter)

Player must actively choose defense:

#### Block
- Reduces damage
- Small combo gain
- Safest option

#### Dodge
- Avoids damage if successful
- Medium reward
- Failure = full damage + combo loss

#### Counter
- Only works vs close attacks
- High reward, high risk

Outcomes:

- Perfect → no damage + big counter + combo gain  
- Good → reduced damage + smaller reward  
- Fail → full damage + combo loss  

Goal:
- Player chooses **risk level**, not just “correct answer”

---

### 5. Combo System (Momentum)

Combo represents momentum.

Gain:
- Attack
- Successful defense
- Fast decisions

Loss:
- Mistakes
- Timeouts
- Heavy damage

Effect:
- Increases damage output

Goal:
- Player feels:
  > “I’m building something”  
  > “I lost momentum because I messed up”

---

### 6. Enemy Identity (UPDATED)

Each enemy must actively pressure the player in a different way:

#### Striker
- Mix of close + long attacks
- Teaches reading + defense basics

#### Breaker
- Punishes blocking
- Builds pressure → big hit
- Forces dodge/counter

#### Disruptor
- Attacks combo
- Slows momentum
- Forces recovery play

#### Controller
- Uses:
  - fast attacks
  - delayed attacks
  - fake telegraphs
- Manipulates reaction timing

#### Hunter
- Targets Tiger
- Applies mark → burst damage
- Forces switching and protection

Goal:
- Player changes behavior per enemy

---

## Test Format

Run short **active combat tests**, not passive ones.

Each test:
- 1 active character
- 2 inactive assists
- 1 enemy with full abilities
- enemy must:
  - attack
  - apply effects
  - punish mistakes

---

## Test Cases

1. Girl vs Striker  
   → Can player read attacks?

2. Man vs Breaker  
   → Does blocking get punished?

3. Officer vs Disruptor  
   → Does combo disruption feel impactful?

4. Any vs Controller  
   → Do fake telegraphs + delays cause mistakes?

5. Girl vs Hunter  
   → Does tiger pressure force switching?

---

## Battle Structure

Each battle must include:

- Enemy that actively attacks
- Visible intent (range/type)
- Timer
- HP changes (both sides)
- Real consequences for mistakes

Turn flow:

1. Enemy selects ability
2. Enemy telegraphs intent
3. Timer starts
4. Player chooses action
5. Player action resolves
6. Enemy action resolves
7. Combo updates
8. Repeat

---

## Assist System

Inactive characters provide:
- 1 active assist (strong effect)
- 1 passive assist (small bonus)

Goal:
- Assists help recover from bad situations

---

## Success Criteria

Playtest succeeds if player feels:

- “I understand what the enemy is doing”
- “I had to react quickly”
- “I got punished when I made mistakes”
- “Different enemies forced different decisions”
- “Different characters feel different”
- “I want to try again and improve”

---

## Failure Signs

Playtest fails if:

- enemy does not pressure player
- player can ignore enemy behavior
- player spams attack safely
- timer feels meaningless
- enemies feel the same
- combat feels passive
- player doesn’t know why they lost

---

## Implementation Notes

- Enemy MUST return full ability objects (not strings)
- Fake telegraph must:
  - display incorrect intent
  - resolve correctly
- Delay strike must:
  - hit after player action
- Damage must be applied every turn if not avoided

Focus on:
- pressure
- clarity
- responsiveness

NOT:
- balance perfection
- architecture

Refer: 
- docs/game-rules.md
- data/enemies.js
- src/data/enemies.js
- src/data/characters.js