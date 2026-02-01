# 🌶️ GAME DESIGN DOCUMENT: FLAVOURMAN BATTLE

> **Project:** Flavourman Battle  
> **Event:** Flavourtown Hack Club  
> **Platform:** Web (HTML5 + Canvas)  
> **Version:** 1.0 (MVP)

---

## 1. Executive Summary
**Flavourman Battle** is a high-energy, local multiplayer 1v1 fighting game. Players control stickman avatars representing the five basic tastes (Spicy, Sweet, Salty, Sour, Umami). The Ultimate goal is to knock the opponent out of the "Dish" (Arena), which is either a Pan or a cooking utensil or deplete their Health Bar using culinary-themed martial arts.

**The Hook:** A fusion of *Super Smash Bros Type* mechanics with retro stickman flash-game aesthetics and a "Flavourtown" culinary theme.

---

## 2. Gameplay Mechanics

### 2.1 Core Loop
1.  **Select Flavor:** Players choose their character class.
2.  **Fight:** 60-second rounds in a physics-based arena.
3.  **Win Condition:** Reduce opponent HP to 0 **OR** Knock the player out of the dish "Arena" **OR** have more HP when time runs out.

### 2.2 Controls (Local Multiplayer)
| Action | Player 1  | Player 2 |
| :--- | :--- | :--- |
| **Move** | W, A, S, D | Arrow Keys | Mappable
| **Jump** | W | SpaceBar | Up Arrow | Mappable
| **Crouch** | D | Left Ctrl | Down Arrow | Mappable
| **Basic Attack** | Left Click | . (Period) | Mappable
| **Special** | F | / (Slash)| 0 | Mappable

### 2.3 Physics & Combat
* **Gravity:** Standard platformer gravity; players must stay on the "plate."
* **Knockback:** Attacks push the enemy back. Lower HP = Higher Knockback scaling.
* **Hitstop:** The game pauses for 50ms upon a successful hit to add impact ("Crunchiness").

---

## 3. Character Classes (The Flavors)

Each character uses the same base Stickman model but differs in **Color**, **Particle Effects**, and **Stats**, which is also **Randomized**.

| Class | Color | Type | Special Ability |
| :--- | :--- | :--- | :--- |
| **SPICY** | 🔴 Red | Glass Cannon | **Fireball:** Shoots a projectile straight forward. |
| **SALTY** | ⚪ White | Tank | **Salt Shield:** Reflects projectiles for 2 seconds. |
| **SOUR** | 🟢 Lime | Disruptor | **Acid Pool:** Leaves a puddle; deals damage over time. |
| **SWEET** | 🩷 Pink | Speedster | **Sugar Rush:** Movement speed doubled for 3 seconds. |
| **UMAMI** | 🟣 Purple | Brawler | **Meat Hammer:** A short-range, massive knockback slam. |

---

## 4. Level Design (The Arenas)

### Primary Arena: "The Cutting Board"
* **Visual:** A wooden texture rectangle floating in the center of the screen.
* **Background:** A blurred kitchen counter.
* **Mechanic:** Standard friction. Pure skill-based combat.

### Stretch Goal Arena: "The Frying Pan"
* **Visual:** Black circular surface with curved edges.
* **Mechanic:** *Sizzle.* Every 15 seconds, the floor glows red and deals burn damage unless players jump.

---

## 5. Some Extras!!

### Some Extra Features:
* **Leaderboard** A leaderboard with highest amount of wins, highest amount of kills, highest amount of damage.
* **Simple Username + passsword login system** A simple login system with only password + username to log in user data, info, stats etc. 
* **Simple Local + Multiplayer + Ai:** The users should be able to play LAN/Local multiplayer, Online Multiplayer, with Ai (Different Levels + randomized Ai Classes )  .

---

## 6. Technical Stack

* **Language:** Vanilla JavaScript (ES6+)
* **Rendering:** HTML5 Canvas API (`<canvas>`)
* **Styling:** CSS3 (for UI overlays)
* **Structure:** Class-based Object Oriented Programming (OOP).

---

## 7. Implementation Roadmap (Hackathon Schedule)

### Phase 1: The Skeleton (Hours 1-3)
- [ ] Set up HTML5 Canvas loop (`requestAnimationFrame`).
- [ ] Implement `InputHandler` (Keyboard listeners).
- [ ] Create `Fighter` class (Movement, Velocity, Gravity, Floor Collision).

### Phase 2: The Violence (Hours 4-6)
- [ ] Implement `Attack` Hitboxes (Rectangular intersection).
- [ ] Add HP logic and Game Over state.
- [ ] Add Basic UI (Health bars using HTML/CSS).

### Phase 3: The Flavour (Hours 7-9)
- [ ] Create subclasses for Spicy/Salty/etc.
- [ ] Implement **one** special move per class.
- [ ] Add Particle System (Confetti/Sauce squares when hit).

### Phase 4: Polish (Final Stretch)
- [ ] Add Sound Effects (Punch, Jump, BGM).
- [ ] Add "FIGHT!" and "WINNER!" and "YOU LOSE!" text + audio.
- [ ] Code Cleanup and Submission.

---

## 8. Asset List

### Audio (Free/Open Source)
* **BGM:** 8-bit / Chiptune (Fast paced).
* **SFX Hit:** Punch/Crunch sound.
* **SFX Jump:** Retro "Whoosh".

### Graphics
* **Clean Modern Ui, with a Retro, Y2K feel**
* **Customizable:** Players can customize thier controls