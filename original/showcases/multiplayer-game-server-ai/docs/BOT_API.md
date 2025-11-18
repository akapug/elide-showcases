# Bot API Reference

Complete reference for creating AI bots.

## Core API

### Bot Decision Function

```python
def decide(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Make a decision for this frame

    Called: ~60 times per second
    Performance: Must complete in <1ms

    Args:
        game_state: Current game state dictionary

    Returns:
        Action dictionary with move, turretAngle, and fire
    """
```

## Game State Structure

### `game_state` Dictionary

```python
{
    # Your tank
    "selfTank": {
        "id": str,                    # Unique tank ID
        "position": {"x": float, "y": float},
        "velocity": {"dx": float, "dy": float},
        "rotation": float,            # Body rotation (radians)
        "turretRotation": float,      # Turret rotation (radians)
        "health": float,              # Current health (0-100)
        "maxHealth": float,           # Maximum health
        "shields": float,             # Shield amount
        "speedBoost": float,          # Speed multiplier (1.0 = normal)
        "rapidFire": bool,            # Has rapid fire power-up
        "alive": bool,                # Is tank alive
        "kills": int,                 # Kill count
        "deaths": int,                # Death count
        "score": int                  # Total score
    },

    # Visible enemy tanks
    "visibleTanks": [
        {
            # All fields same as selfTank, plus:
            "distance": float,        # Pre-calculated distance to you
            "angle": float,          # Pre-calculated angle to you (radians)
            "isAI": bool             # Whether this tank is AI
        }
    ],

    # Incoming projectiles
    "visibleProjectiles": [
        {
            "id": str,
            "position": {"x": float, "y": float},
            "velocity": {"dx": float, "dy": float},
            "rotation": float,        # Direction (radians)
            "ownerId": str,          # Who fired it
            "damage": float,         # Damage amount
            "distance": float,       # Distance to you
            "angle": float          # Angle to you
        }
    ],

    # Nearby power-ups
    "nearbyPowerUps": [
        {
            "id": str,
            "type": str,             # "shield", "speed", "rapidfire", "health"
            "position": {"x": float, "y": float},
            "distance": float,       # Distance to you
            "angle": float          # Angle to you
        }
    ],

    # Map obstacles
    "obstacles": [
        {
            "x": float,
            "y": float,
            "width": float,
            "height": float
        }
    ],

    # Map size
    "mapSize": {
        "width": float,
        "height": float
    }
}
```

### Pre-calculated Fields

For performance, these fields are pre-calculated:
- `distance`: Euclidean distance from your tank
- `angle`: Angle in radians (use with `math.atan2`)

## Action Structure

### Return Value

```python
{
    "move": {
        "dx": float,  # X movement (-1 to 1, will be normalized)
        "dy": float   # Y movement (-1 to 1, will be normalized)
    },
    # or None for no movement

    "turretAngle": float,  # Turret angle in radians
    # or None to keep current angle

    "fire": bool  # True to fire this frame
}
```

### Movement

Movement vector `{dx, dy}` is automatically normalized:

```python
# Move right at full speed
{"dx": 1.0, "dy": 0.0}

# Move diagonally (automatically normalized)
{"dx": 1.0, "dy": 1.0}  # Same speed as {0.707, 0.707}

# Move slowly (use smaller values)
{"dx": 0.5, "dy": 0.0}
```

### Angles

All angles in radians:
- `0`: Right
- `π/2`: Down
- `π` or `-π`: Left
- `-π/2`: Up

```python
import math

# Aim right
turretAngle = 0

# Aim at position
turretAngle = math.atan2(target_y - my_y, target_x - my_x)

# Normalize angle to [-π, π]
while turretAngle > math.pi:
    turretAngle -= 2 * math.pi
while turretAngle < -math.pi:
    turretAngle += 2 * math.pi
```

## Utility Functions

### Distance Calculation

```python
def distance(pos1: Dict, pos2: Dict) -> float:
    """Calculate distance between two positions"""
    dx = pos1["x"] - pos2["x"]
    dy = pos1["y"] - pos2["y"]
    return math.sqrt(dx * dx + dy * dy)
```

### Angle Calculation

```python
def angle_to(from_pos: Dict, to_pos: Dict) -> float:
    """Calculate angle from one position to another"""
    dx = to_pos["x"] - from_pos["x"]
    dy = to_pos["y"] - from_pos["y"]
    return math.atan2(dy, dx)
```

### Normalize Vector

```python
def normalize(dx: float, dy: float) -> tuple[float, float]:
    """Normalize a vector to length 1"""
    length = math.sqrt(dx * dx + dy * dy)
    if length == 0:
        return 0, 0
    return dx / length, dy / length
```

## Common Patterns

### Chase Enemy

```python
def chase(self_tank: Dict, enemy: Dict) -> Dict:
    angle = angle_to(self_tank["position"], enemy["position"])
    return {
        "move": {"dx": math.cos(angle), "dy": math.sin(angle)},
        "turretAngle": angle,
        "fire": enemy["distance"] < 500
    }
```

### Flee from Enemy

```python
def flee(self_tank: Dict, enemy: Dict) -> Dict:
    angle = angle_to(enemy["position"], self_tank["position"])
    return {
        "move": {"dx": math.cos(angle), "dy": math.sin(angle)},
        "turretAngle": angle_to(self_tank["position"], enemy["position"]),
        "fire": False
    }
```

### Predict Shot

```python
def predict_shot(self_tank: Dict, target: Dict) -> float:
    """Aim ahead of moving target"""
    projectile_speed = 600

    # Distance to target
    dx = target["position"]["x"] - self_tank["position"]["x"]
    dy = target["position"]["y"] - self_tank["position"]["y"]
    distance = math.sqrt(dx * dx + dy * dy)

    # Time for bullet to reach target
    time = distance / projectile_speed

    # Predict target's future position
    future_x = target["position"]["x"] + target["velocity"]["dx"] * time
    future_y = target["position"]["y"] + target["velocity"]["dy"] * time

    # Aim at future position
    return math.atan2(
        future_y - self_tank["position"]["y"],
        future_x - self_tank["position"]["x"]
    )
```

### Circle Strafe

```python
def circle_strafe(self_tank: Dict, target: Dict, clockwise: bool = True) -> Dict:
    """Orbit around target while firing"""
    angle_to_target = angle_to(self_tank["position"], target["position"])

    # Move perpendicular to target
    move_angle = angle_to_target + (math.pi/2 if clockwise else -math.pi/2)

    return {
        "move": {
            "dx": math.cos(move_angle),
            "dy": math.sin(move_angle)
        },
        "turretAngle": predict_shot(self_tank, target),
        "fire": True
    }
```

## Performance Tips

### DO ✅

- Use pre-calculated `distance` and `angle` fields
- Return early when possible
- Cache computations in bot instance variables
- Use simple math (avoid heavy libraries)

```python
class FastBot:
    def decide(self, game_state):
        enemies = game_state["visibleTanks"]

        # Good: Use pre-calculated distance
        if enemies and enemies[0]["distance"] < 200:
            return self.flee(enemies[0])

        # Good: Early return
        return self.patrol()
```

### DON'T ❌

- Import heavy libraries (numpy, tensorflow)
- Do expensive calculations every frame
- Use blocking operations
- Iterate over all entities

```python
# Bad: Heavy library
import numpy as np
positions = np.array([...])  # Too slow!

# Bad: Recalculate distance
for enemy in enemies:
    distance = math.sqrt(...)  # Use enemy["distance"] instead!

# Bad: Blocking
time.sleep(0.001)  # NEVER block!
```

## Constants

```python
# Map
MAP_WIDTH = 2000
MAP_HEIGHT = 2000

# Tank
TANK_RADIUS = 20
TANK_MAX_SPEED = 200  # pixels/second
TANK_MAX_HEALTH = 100

# Projectile
PROJECTILE_SPEED = 600  # pixels/second
PROJECTILE_DAMAGE = 25
PROJECTILE_MAX_RANGE = 1000

# Visibility
VISIBILITY_RANGE = 800  # How far you can see

# Power-ups
POWERUP_SHIELD_AMOUNT = 50
POWERUP_SPEED_MULTIPLIER = 1.5
POWERUP_RAPID_FIRE_DURATION = 10  # seconds
```

## Error Handling

If your bot throws an exception, a default action is returned:

```python
{
    "move": None,
    "turretAngle": None,
    "fire": False
}
```

Always validate inputs to avoid crashes:

```python
def decide(self, game_state):
    try:
        enemies = game_state.get("visibleTanks", [])
        if not enemies:
            return self.patrol()

        # ... your logic
    except Exception as e:
        # Fallback action
        return {"move": None, "turretAngle": None, "fire": False}
```

## Testing Your Bot

### Unit Test

```python
def test_bot():
    bot = MyBot("test_bot")

    game_state = {
        "selfTank": {
            "position": {"x": 100, "y": 100},
            "health": 100,
            # ...
        },
        "visibleTanks": [
            {
                "position": {"x": 200, "y": 200},
                "distance": 141.4,
                "angle": 0.785,
                # ...
            }
        ]
    }

    action = bot.decide(game_state)
    assert action["fire"] == True  # Should attack nearby enemy
```

### Performance Test

```python
import time

bot = MyBot("test_bot")
game_state = {...}  # Realistic game state

# Measure decision time
times = []
for _ in range(1000):
    start = time.perf_counter()
    bot.decide(game_state)
    times.append(time.perf_counter() - start)

avg_time = sum(times) / len(times) * 1000  # Convert to ms
print(f"Average decision time: {avg_time:.3f}ms")

# Should be < 1ms for Elide, < 2ms for Node.js
assert avg_time < 2.0, f"Too slow: {avg_time}ms"
```

## Examples

See `examples/` directory for complete bot implementations:
- `custom_bot.py`: Template with all strategies
- `aggressive_bot.py`: Rush and attack
- `defensive_bot.py`: Cautious, retreat when hurt
- `sniper_bot.py`: Long-range combat

## Resources

- [Bot Tutorial](bot_tutorial.md): Step-by-step guide
- [Game Mechanics](GAME_MECHANICS.md): How the game works
- [Performance Guide](PERFORMANCE.md): Optimization tips
