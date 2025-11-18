# Bot Tutorial: Create Your Own AI Tank

This guide will teach you how to create custom AI bots for Tank Battle Arena.

## Quick Start

1. Copy `examples/custom_bot.py` to `ai/my_bot.py`
2. Modify the decision logic
3. Update `ai/bot.py` to use your bot
4. Test your bot in the game!

## Bot Structure

Every bot must implement a `decide()` function that:
- Takes `game_state` as input
- Returns an `action` dictionary
- **Completes in <1ms** (critical for 60 FPS)

```python
def decide(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
    """Make a decision every frame"""

    # Your logic here

    return {
        "move": {"dx": 0.5, "dy": 0.5},  # Movement direction (normalized)
        "turretAngle": 1.57,  # Angle in radians
        "fire": True  # Whether to fire
    }
```

## Game State

The `game_state` parameter contains:

```python
{
    "selfTank": {
        "id": "bot_1",
        "position": {"x": 500, "y": 500},
        "velocity": {"dx": 10, "dy": 5},
        "rotation": 0.5,  # Body rotation
        "turretRotation": 1.0,  # Turret rotation
        "health": 80,
        "maxHealth": 100,
        "shields": 20,
        "speedBoost": 1.0,
        "alive": True
    },

    "visibleTanks": [
        {
            "id": "enemy_1",
            "position": {"x": 800, "y": 600},
            "distance": 316.2,  # Pre-calculated
            "angle": 0.78,  # Pre-calculated
            # ... same fields as selfTank
        }
    ],

    "visibleProjectiles": [
        {
            "position": {"x": 700, "y": 550},
            "velocity": {"dx": 500, "dy": 0},
            "distance": 200.0,
            "ownerId": "enemy_1"
        }
    ],

    "nearbyPowerUps": [
        {
            "type": "shield",  # shield, speed, rapidfire, health
            "position": {"x": 600, "y": 500},
            "distance": 100.0
        }
    ],

    "obstacles": [
        {"x": 400, "y": 400, "width": 100, "height": 100}
    ],

    "mapSize": {"width": 2000, "height": 2000}
}
```

## Action Output

Return an action dictionary:

```python
{
    "move": {"dx": 1.0, "dy": 0.0},  # Move right (will be normalized)
    # or None for no movement

    "turretAngle": 1.57,  # Aim turret (radians)
    # or None to keep current angle

    "fire": True  # Fire this frame
}
```

## Bot Strategies

### 1. Aggressive Bot

```python
def decide(self, game_state):
    enemies = game_state["visibleTanks"]

    if enemies:
        target = enemies[0]  # Attack nearest

        # Move towards enemy
        angle = self._angle_to(
            game_state["selfTank"]["position"],
            target["position"]
        )

        return {
            "move": {"dx": math.cos(angle), "dy": math.sin(angle)},
            "turretAngle": angle,
            "fire": True  # Always firing!
        }

    return self._patrol(game_state)
```

### 2. Defensive Bot

```python
def decide(self, game_state):
    self_tank = game_state["selfTank"]
    enemies = game_state["visibleTanks"]

    # Retreat if health low
    if self_tank["health"] < 30:
        if enemies:
            # Run away from nearest enemy
            nearest = enemies[0]
            dx = self_tank["position"]["x"] - nearest["position"]["x"]
            dy = self_tank["position"]["y"] - nearest["position"]["y"]
            length = math.sqrt(dx*dx + dy*dy)

            return {
                "move": {"dx": dx/length, "dy": dy/length},
                "turretAngle": self._angle_to(self_tank["position"], nearest["position"]),
                "fire": False  # Just run!
            }

    # Otherwise, defend position
    return self._defend_position(game_state)
```

### 3. Sniper Bot

```python
def decide(self, game_state):
    self_tank = game_state["selfTank"]
    enemies = game_state["visibleTanks"]

    if enemies:
        target = enemies[0]
        distance = target["distance"]

        optimal_range = 600  # Long range

        if distance > optimal_range:
            # Move closer
            angle = target["angle"]
            return {
                "move": {"dx": math.cos(angle), "dy": math.sin(angle)},
                "turretAngle": self._predict_shot(self_tank, target),
                "fire": False
            }
        elif distance < optimal_range - 100:
            # Back up
            angle = target["angle"]
            return {
                "move": {"dx": -math.cos(angle), "dy": -math.sin(angle)},
                "turretAngle": self._predict_shot(self_tank, target),
                "fire": False
            }
        else:
            # Perfect range - don't move, just aim and fire
            return {
                "move": None,
                "turretAngle": self._predict_shot(self_tank, target),
                "fire": True
            }

    return self._patrol(game_state)
```

## Performance Tips

Your bot runs 60 times per second, so performance matters!

### DO ✅

- Use simple calculations
- Cache expensive computations
- Return early when possible
- Use pre-calculated distances/angles from game state

```python
def decide(self, game_state):
    # Good: Use pre-calculated distance
    enemies = game_state["visibleTanks"]
    if enemies:
        nearest = enemies[0]  # Already sorted by distance!
        if nearest["distance"] < 200:  # Use pre-calculated
            return self._flee()
```

### DON'T ❌

- Use heavy libraries (numpy, tensorflow inference)
- Do complex pathfinding every frame
- Iterate over all possible targets
- Use time.sleep() or any blocking calls

```python
def decide(self, game_state):
    # Bad: Expensive calculation every frame
    import numpy as np
    all_positions = np.array([...])  # NO!

    time.sleep(0.01)  # NEVER!
```

## Testing Your Bot

### 1. Local Testing

```bash
# Test with your bot
export AI_DIFFICULTY=medium
npm start

# Watch your bot in action
# Open http://localhost:3000 and choose "Watch AI Battle"
```

### 2. Benchmark Your Bot

```bash
# Test decision latency
npm run benchmark:ai
```

Your bot should complete decisions in <1ms for Elide, <2ms for Node.js.

### 3. Battle Testing

Create multiple bot types and pit them against each other:

```python
# ai/bot.py

from ai.aggressive_bot import AggressiveBot
from ai.defensive_bot import DefensiveBot
from ai.sniper_bot import SniperBot

bot_types = [AggressiveBot, DefensiveBot, SniperBot]

def get_bot_decision(tank_id, game_state, difficulty):
    bot_type = bot_types[hash(tank_id) % len(bot_types)]
    bot = bot_type(tank_id, difficulty)
    return bot.decide(game_state)
```

## Advanced Techniques

### 1. State Machines

```python
class StateMachineBot:
    def __init__(self):
        self.state = "patrol"  # patrol, chase, attack, flee

    def decide(self, game_state):
        if self.state == "patrol":
            return self._patrol(game_state)
        elif self.state == "chase":
            return self._chase(game_state)
        # ... etc
```

### 2. Behavior Trees

```python
class BehaviorNode:
    def execute(self, context):
        pass

class Selector(BehaviorNode):
    """Try children until one succeeds"""
    def __init__(self, children):
        self.children = children

    def execute(self, context):
        for child in self.children:
            result = child.execute(context)
            if result:
                return result
        return None
```

### 3. Target Prediction

```python
def _predict_position(self, tank, time):
    """Predict where tank will be in 'time' seconds"""
    return {
        "x": tank["position"]["x"] + tank["velocity"]["dx"] * time,
        "y": tank["position"]["y"] + tank["velocity"]["dy"] * time
    }

def _predict_shot(self, self_tank, target):
    """Aim where target will be when bullet arrives"""
    projectile_speed = 600
    distance = target["distance"]
    time_to_impact = distance / projectile_speed

    future_pos = self._predict_position(target, time_to_impact)

    return math.atan2(
        future_pos["y"] - self_tank["position"]["y"],
        future_pos["x"] - self_tank["position"]["x"]
    )
```

### 4. Dodging

```python
def _should_dodge(self, self_tank, projectiles):
    """Check if we need to dodge incoming fire"""
    for proj in projectiles:
        # Is it heading towards us?
        proj_vel = proj["velocity"]
        to_us_x = self_tank["position"]["x"] - proj["position"]["x"]
        to_us_y = self_tank["position"]["y"] - proj["position"]["y"]

        # Dot product to check if heading our way
        dot = proj_vel["dx"] * to_us_x + proj_vel["dy"] * to_us_y

        if dot > 0 and proj["distance"] < 200:
            return True, proj

    return False, None

def _dodge(self, projectile):
    """Move perpendicular to projectile"""
    vel = projectile["velocity"]
    return {
        "move": {"dx": -vel["dy"], "dy": vel["dx"]},
        "fire": False
    }
```

## Example: Complete Custom Bot

See `examples/custom_bot.py` for a full implementation with:
- Projectile dodging
- Health-based retreating
- Combat engagement at optimal range
- Power-up collection
- Map exploration

## Bot Ideas

Try implementing these:

- **Kamikaze Bot**: Rush enemies, ram them
- **Support Bot**: Collect power-ups, share with teammates
- **Territory Bot**: Defend a specific area
- **Hunter Bot**: Track and eliminate one target
- **Chaos Bot**: Random unpredictable movements
- **Pack Bot**: Coordinate with other AI bots
- **Coward Bot**: Run from everything, survive longest

## Debugging

Add logging (but remove before deployment for performance):

```python
def decide(self, game_state):
    enemies = game_state["visibleTanks"]

    # Debug logging
    if enemies:
        print(f"Bot {self.bot_id}: Engaging {len(enemies)} enemies")

    # ... your logic
```

## Next Steps

1. Study `ai/bot.py` to see the default bot
2. Copy `examples/custom_bot.py` and modify it
3. Test your bot performance with benchmarks
4. Share your best bot strategies!

## Resources

- [Bot API Reference](../docs/BOT_API.md)
- [Game Mechanics](../docs/GAME_MECHANICS.md)
- [Performance Guide](../docs/PERFORMANCE.md)

Happy bot building! 🤖🎮
