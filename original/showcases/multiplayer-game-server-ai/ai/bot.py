"""
Main AI Bot - Entry point for bot decision making
This module is called from TypeScript via the polyglot bridge
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import math


@dataclass
class Position:
    """2D position"""
    x: float
    y: float


@dataclass
class Action:
    """Bot action to perform"""
    move: Optional[Dict[str, float]] = None  # {"dx": float, "dy": float}
    turretAngle: Optional[float] = None
    fire: bool = False


@dataclass
class Tank:
    """Tank information"""
    id: str
    position: Position
    velocity: Dict[str, float]
    rotation: float
    turretRotation: float
    health: float
    maxHealth: float
    isAI: bool
    alive: bool
    shields: float = 0
    speedBoost: float = 1.0
    rapidFire: bool = False


@dataclass
class GameState:
    """Simplified game state for AI"""
    selfTank: Tank
    visibleTanks: List[Tank]
    visibleProjectiles: List[Any]
    nearbyPowerUps: List[Any]
    obstacles: List[Dict[str, float]]
    mapSize: Dict[str, float]


def distance(pos1: Position, pos2: Position) -> float:
    """Calculate distance between two positions"""
    dx = pos1.x - pos2.x
    dy = pos1.y - pos2.y
    return math.sqrt(dx * dx + dy * dy)


def angle_to(from_pos: Position, to_pos: Position) -> float:
    """Calculate angle from one position to another"""
    dx = to_pos.x - from_pos.x
    dy = to_pos.y - from_pos.y
    return math.atan2(dy, dx)


def normalize_angle(angle: float) -> float:
    """Normalize angle to [-PI, PI]"""
    while angle > math.pi:
        angle -= 2 * math.pi
    while angle < -math.pi:
        angle += 2 * math.pi
    return angle


class SimpleBot:
    """Simple AI bot with behavior tree logic"""

    def __init__(self, difficulty: str = "medium"):
        self.difficulty = difficulty
        self.state = "patrol"
        self.patrol_target = None
        self.attack_target = None

        # Difficulty settings
        self.settings = self._get_difficulty_settings(difficulty)

    def _get_difficulty_settings(self, difficulty: str) -> Dict[str, float]:
        """Get settings based on difficulty"""
        settings = {
            "easy": {
                "aim_accuracy": 0.7,
                "reaction_time": 0.3,
                "aggression": 0.5,
                "retreat_threshold": 0.3
            },
            "medium": {
                "aim_accuracy": 0.85,
                "reaction_time": 0.15,
                "aggression": 0.7,
                "retreat_threshold": 0.25
            },
            "hard": {
                "aim_accuracy": 0.95,
                "reaction_time": 0.05,
                "aggression": 0.9,
                "retreat_threshold": 0.15
            }
        }
        return settings.get(difficulty, settings["medium"])

    def decide(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main decision function - called every frame
        Must complete in <1ms to maintain 60 FPS

        Args:
            game_state: Current game state from TypeScript

        Returns:
            Action dictionary with move, turretAngle, and fire
        """
        # Parse game state
        self_tank = game_state["selfTank"]
        enemies = game_state.get("visibleTanks", [])
        power_ups = game_state.get("nearbyPowerUps", [])
        projectiles = game_state.get("visibleProjectiles", [])

        # Initialize action
        action = {
            "move": None,
            "turretAngle": None,
            "fire": False
        }

        # Priority 1: Dodge incoming projectiles
        if projectiles:
            dodge_action = self._dodge_projectiles(self_tank, projectiles)
            if dodge_action:
                return dodge_action

        # Priority 2: Retreat if low health
        health_ratio = self_tank["health"] / self_tank["maxHealth"]
        if health_ratio < self.settings["retreat_threshold"] and enemies:
            return self._retreat(self_tank, enemies)

        # Priority 3: Attack enemies
        if enemies:
            return self._attack(self_tank, enemies)

        # Priority 4: Collect power-ups
        if power_ups:
            return self._collect_power_up(self_tank, power_ups)

        # Default: Patrol
        return self._patrol(self_tank, game_state.get("mapSize", {"width": 2000, "height": 2000}))

    def _dodge_projectiles(self, self_tank: Dict, projectiles: List[Dict]) -> Optional[Dict]:
        """Dodge incoming projectiles"""
        dangerous = []

        for proj in projectiles:
            # Check if projectile is heading towards us
            proj_pos = proj["position"]
            self_pos = self_tank["position"]

            dx = self_pos["x"] - proj_pos["x"]
            dy = self_pos["y"] - proj_pos["y"]
            dist = math.sqrt(dx * dx + dy * dy)

            if dist < 200:  # Within danger range
                dangerous.append(proj)

        if not dangerous:
            return None

        # Move perpendicular to nearest projectile
        nearest = min(dangerous, key=lambda p: self._dist_to_tank(self_tank, p))
        proj_vel = nearest["velocity"]

        # Perpendicular movement
        return {
            "move": {"dx": -proj_vel["dy"], "dy": proj_vel["dx"]},
            "turretAngle": None,
            "fire": False
        }

    def _retreat(self, self_tank: Dict, enemies: List[Dict]) -> Dict:
        """Retreat from enemies"""
        # Find nearest enemy
        nearest = min(enemies, key=lambda e: self._dist_to_tank(self_tank, e))

        # Move away from nearest enemy
        self_pos = self_tank["position"]
        enemy_pos = nearest["position"]

        dx = self_pos["x"] - enemy_pos["x"]
        dy = self_pos["y"] - enemy_pos["y"]
        length = math.sqrt(dx * dx + dy * dy)

        if length > 0:
            dx /= length
            dy /= length

        return {
            "move": {"dx": dx, "dy": dy},
            "turretAngle": self._angle_between_tanks(self_tank, nearest),
            "fire": False  # Don't fire while retreating
        }

    def _attack(self, self_tank: Dict, enemies: List[Dict]) -> Dict:
        """Attack nearest enemy"""
        # Find nearest enemy
        target = min(enemies, key=lambda e: self._dist_to_tank(self_tank, e))

        # Calculate aim angle with lead prediction
        aim_angle = self._predict_shot(self_tank, target)

        # Calculate movement (circle strafe or approach)
        dist = self._dist_to_tank(self_tank, target)
        optimal_range = 400  # Optimal combat range

        move_dx = 0.0
        move_dy = 0.0

        if dist > optimal_range + 100:
            # Too far, move closer
            angle = self._angle_between_tanks(self_tank, target)
            move_dx = math.cos(angle)
            move_dy = math.sin(angle)
        elif dist < optimal_range - 100:
            # Too close, back up
            angle = self._angle_between_tanks(self_tank, target)
            move_dx = -math.cos(angle)
            move_dy = -math.sin(angle)
        else:
            # Good range, strafe
            angle = self._angle_between_tanks(self_tank, target)
            move_dx = -math.sin(angle)  # Perpendicular movement
            move_dy = math.cos(angle)

        # Decide whether to fire
        current_angle = self_tank["turretRotation"]
        angle_diff = abs(normalize_angle(aim_angle - current_angle))
        should_fire = angle_diff < 0.1 * (1 / self.settings["aim_accuracy"])

        return {
            "move": {"dx": move_dx, "dy": move_dy} if move_dx != 0 or move_dy != 0 else None,
            "turretAngle": aim_angle,
            "fire": should_fire
        }

    def _collect_power_up(self, self_tank: Dict, power_ups: List[Dict]) -> Dict:
        """Move to collect nearest power-up"""
        # Find nearest power-up
        target = min(power_ups, key=lambda p: self._dist_to_powerup(self_tank, p))

        # Move towards it
        angle = self._angle_to_powerup(self_tank, target)

        return {
            "move": {"dx": math.cos(angle), "dy": math.sin(angle)},
            "turretAngle": self_tank["turretRotation"],
            "fire": False
        }

    def _patrol(self, self_tank: Dict, map_size: Dict) -> Dict:
        """Patrol the map"""
        # Simple patrol: move in a direction
        if self.patrol_target is None:
            self.patrol_target = {
                "x": math.random() * map_size["width"],
                "y": math.random() * map_size["height"]
            }

        # Check if reached patrol target
        self_pos = self_tank["position"]
        dx = self.patrol_target["x"] - self_pos["x"]
        dy = self.patrol_target["y"] - self_pos["y"]
        dist = math.sqrt(dx * dx + dy * dy)

        if dist < 100:
            # Pick new target
            self.patrol_target = None
            return self._patrol(self_tank, map_size)

        # Move towards patrol target
        angle = math.atan2(dy, dx)

        return {
            "move": {"dx": math.cos(angle), "dy": math.sin(angle)},
            "turretAngle": angle,
            "fire": False
        }

    def _predict_shot(self, self_tank: Dict, target: Dict) -> float:
        """Predict shot angle with target lead"""
        self_pos = self_tank["position"]
        target_pos = target["position"]
        target_vel = target["velocity"]

        # Simple lead prediction
        projectile_speed = 600
        dx = target_pos["x"] - self_pos["x"]
        dy = target_pos["y"] - self_pos["y"]
        dist = math.sqrt(dx * dx + dy * dy)

        time_to_impact = dist / projectile_speed

        # Predict target position
        pred_x = target_pos["x"] + target_vel["dx"] * time_to_impact
        pred_y = target_pos["y"] + target_vel["dy"] * time_to_impact

        # Calculate angle to predicted position
        return math.atan2(pred_y - self_pos["y"], pred_x - self_pos["x"])

    def _dist_to_tank(self, self_tank: Dict, other: Dict) -> float:
        """Calculate distance to another tank"""
        dx = self_tank["position"]["x"] - other["position"]["x"]
        dy = self_tank["position"]["y"] - other["position"]["y"]
        return math.sqrt(dx * dx + dy * dy)

    def _dist_to_powerup(self, self_tank: Dict, powerup: Dict) -> float:
        """Calculate distance to power-up"""
        dx = self_tank["position"]["x"] - powerup["position"]["x"]
        dy = self_tank["position"]["y"] - powerup["position"]["y"]
        return math.sqrt(dx * dx + dy * dy)

    def _angle_between_tanks(self, self_tank: Dict, other: Dict) -> float:
        """Calculate angle from self to other tank"""
        dx = other["position"]["x"] - self_tank["position"]["x"]
        dy = other["position"]["y"] - self_tank["position"]["y"]
        return math.atan2(dy, dx)

    def _angle_to_powerup(self, self_tank: Dict, powerup: Dict) -> float:
        """Calculate angle to power-up"""
        dx = powerup["position"]["x"] - self_tank["position"]["x"]
        dy = powerup["position"]["y"] - self_tank["position"]["y"]
        return math.atan2(dy, dx)


# Global bot instances (one per AI tank)
_bot_instances: Dict[str, SimpleBot] = {}


def get_bot_decision(tank_id: str, game_state: Dict[str, Any], difficulty: str = "medium") -> Dict[str, Any]:
    """
    Get decision for a specific bot
    Called from TypeScript via polyglot bridge

    This function completes in <1ms to maintain 60 FPS

    Args:
        tank_id: ID of the bot tank
        game_state: Current game state
        difficulty: Bot difficulty (easy, medium, hard)

    Returns:
        Action dictionary
    """
    # Get or create bot instance
    if tank_id not in _bot_instances:
        _bot_instances[tank_id] = SimpleBot(difficulty)

    bot = _bot_instances[tank_id]

    # Make decision
    return bot.decide(game_state)


def get_multiple_decisions(decisions_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Get decisions for multiple bots in parallel
    This is the main entry point from TypeScript

    Args:
        decisions_data: List of {tank_id, game_state, difficulty}

    Returns:
        List of action dictionaries
    """
    results = []

    for data in decisions_data:
        tank_id = data["tankId"]
        game_state = data["gameState"]
        difficulty = data.get("difficulty", "medium")

        decision = get_bot_decision(tank_id, game_state, difficulty)
        results.append(decision)

    return results


# Export for Elide polyglot
__all__ = ["get_bot_decision", "get_multiple_decisions", "SimpleBot"]
