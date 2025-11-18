"""
Example Custom Bot - Template for creating your own AI bot

This bot demonstrates how to:
1. Access game state
2. Make movement decisions
3. Aim and fire
4. Use power-ups strategically
"""

import math
from typing import Dict, Any, List, Optional


class CustomBot:
    """
    Custom AI bot implementation

    This is a template you can modify to create your own bot strategy.
    """

    def __init__(self, bot_id: str, difficulty: str = "medium"):
        self.bot_id = bot_id
        self.difficulty = difficulty
        self.state = "exploring"  # exploring, attacking, retreating, power_up_hunting

        # Custom parameters (tune these!)
        self.aggression = 0.7  # How aggressive (0-1)
        self.caution = 0.5  # How cautious (0-1)
        self.optimal_range = 400  # Preferred combat distance

    def decide(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main decision function - called every frame (~60 times/second)

        IMPORTANT: Must complete in <1ms to maintain 60 FPS!

        Args:
            game_state: Dictionary containing:
                - selfTank: Your tank's state
                - visibleTanks: List of tanks you can see
                - visibleProjectiles: List of incoming projectiles
                - nearbyPowerUps: List of power-ups near you
                - obstacles: List of obstacles on the map
                - mapSize: {width, height}

        Returns:
            Dictionary with:
                - move: {dx, dy} or None
                - turretAngle: float (radians) or None
                - fire: bool
        """

        self_tank = game_state["selfTank"]
        enemies = game_state.get("visibleTanks", [])
        projectiles = game_state.get("visibleProjectiles", [])
        power_ups = game_state.get("nearbyPowerUps", [])

        # Example decision logic
        # You can replace this with your own strategy!

        # 1. SURVIVAL: Dodge incoming projectiles
        if projectiles:
            dangerous = self._find_dangerous_projectiles(self_tank, projectiles)
            if dangerous:
                return self._dodge(self_tank, dangerous[0])

        # 2. HEALTH: Retreat if low health
        health_ratio = self_tank["health"] / self_tank["maxHealth"]
        if health_ratio < 0.3 * self.caution:
            if enemies:
                return self._retreat_from_enemies(self_tank, enemies)

        # 3. COMBAT: Attack visible enemies
        if enemies:
            return self._engage_enemy(self_tank, enemies[0])  # Attack nearest

        # 4. POWER-UPS: Collect power-ups if safe
        if power_ups and health_ratio > 0.5:
            return self._collect_power_up(self_tank, power_ups[0])

        # 5. DEFAULT: Explore the map
        return self._explore(self_tank, game_state["mapSize"])

    def _find_dangerous_projectiles(self, self_tank: Dict, projectiles: List[Dict]) -> List[Dict]:
        """Find projectiles heading towards us"""
        dangerous = []

        for proj in projectiles:
            # Calculate if projectile is heading our way
            dx = self_tank["position"]["x"] - proj["position"]["x"]
            dy = self_tank["position"]["y"] - proj["position"]["y"]
            distance = math.sqrt(dx * dx + dy * dy)

            # Check if within danger zone
            if distance < 300:
                dangerous.append(proj)

        return dangerous

    def _dodge(self, self_tank: Dict, projectile: Dict) -> Dict:
        """Dodge a projectile by moving perpendicular"""
        vel = projectile["velocity"]

        # Move perpendicular to projectile direction
        return {
            "move": {"dx": -vel["dy"] / 100, "dy": vel["dx"] / 100},
            "turretAngle": self_tank["turretRotation"],
            "fire": False
        }

    def _retreat_from_enemies(self, self_tank: Dict, enemies: List[Dict]) -> Dict:
        """Retreat away from enemies"""
        # Find nearest enemy
        nearest = enemies[0]

        # Calculate direction away from enemy
        dx = self_tank["position"]["x"] - nearest["position"]["x"]
        dy = self_tank["position"]["y"] - nearest["position"]["y"]
        length = math.sqrt(dx * dx + dy * dy)

        if length > 0:
            dx /= length
            dy /= length

        # Aim at enemy while retreating
        aim_angle = self._calculate_aim_angle(self_tank, nearest)

        return {
            "move": {"dx": dx, "dy": dy},
            "turretAngle": aim_angle,
            "fire": False  # Don't fire while retreating (or set to True for retreat & fire)
        }

    def _engage_enemy(self, self_tank: Dict, enemy: Dict) -> Dict:
        """Engage an enemy tank"""
        distance = self._distance(
            self_tank["position"],
            enemy["position"]
        )

        # Calculate aim with lead prediction
        aim_angle = self._predict_shot(self_tank, enemy)

        # Movement strategy based on distance
        move_dx = 0.0
        move_dy = 0.0

        if distance > self.optimal_range + 100:
            # Too far - move closer
            angle = self._angle_to(self_tank["position"], enemy["position"])
            move_dx = math.cos(angle) * self.aggression
            move_dy = math.sin(angle) * self.aggression
        elif distance < self.optimal_range - 100:
            # Too close - back up
            angle = self._angle_to(self_tank["position"], enemy["position"])
            move_dx = -math.cos(angle) * self.caution
            move_dy = -math.sin(angle) * self.caution
        else:
            # Optimal range - strafe
            angle = self._angle_to(self_tank["position"], enemy["position"])
            move_dx = -math.sin(angle) * 0.5  # Strafe perpendicular
            move_dy = math.cos(angle) * 0.5

        # Decide if we should fire
        angle_diff = abs(self._normalize_angle(aim_angle - self_tank["turretRotation"]))
        should_fire = angle_diff < 0.15  # Fire if aimed within ~8 degrees

        return {
            "move": {"dx": move_dx, "dy": move_dy} if move_dx != 0 or move_dy != 0 else None,
            "turretAngle": aim_angle,
            "fire": should_fire
        }

    def _collect_power_up(self, self_tank: Dict, power_up: Dict) -> Dict:
        """Move to collect a power-up"""
        angle = self._angle_to(
            self_tank["position"],
            power_up["position"]
        )

        return {
            "move": {"dx": math.cos(angle), "dy": math.sin(angle)},
            "turretAngle": angle,
            "fire": False
        }

    def _explore(self, self_tank: Dict, map_size: Dict) -> Dict:
        """Explore the map when nothing else to do"""
        # Simple exploration: move in random direction
        # You could implement more sophisticated patrolling here

        angle = hash(self.bot_id) % 360  # Deterministic but varied per bot
        angle_rad = math.radians(angle)

        return {
            "move": {"dx": math.cos(angle_rad), "dy": math.sin(angle_rad)},
            "turretAngle": angle_rad,
            "fire": False
        }

    def _predict_shot(self, self_tank: Dict, target: Dict) -> float:
        """Predict where to aim to hit a moving target"""
        # Simple lead prediction
        projectile_speed = 600  # pixels/second

        dx = target["position"]["x"] - self_tank["position"]["x"]
        dy = target["position"]["y"] - self_tank["position"]["y"]
        distance = math.sqrt(dx * dx + dy * dy)

        # Time for projectile to reach current target position
        time_to_impact = distance / projectile_speed

        # Predict target's future position
        future_x = target["position"]["x"] + target["velocity"]["dx"] * time_to_impact
        future_y = target["position"]["y"] + target["velocity"]["dy"] * time_to_impact

        # Aim at predicted position
        return math.atan2(
            future_y - self_tank["position"]["y"],
            future_x - self_tank["position"]["x"]
        )

    def _calculate_aim_angle(self, self_tank: Dict, target: Dict) -> float:
        """Calculate angle to target"""
        return self._angle_to(
            self_tank["position"],
            target["position"]
        )

    def _distance(self, pos1: Dict, pos2: Dict) -> float:
        """Calculate distance between two positions"""
        dx = pos1["x"] - pos2["x"]
        dy = pos1["y"] - pos2["y"]
        return math.sqrt(dx * dx + dy * dy)

    def _angle_to(self, from_pos: Dict, to_pos: Dict) -> float:
        """Calculate angle from one position to another"""
        dx = to_pos["x"] - from_pos["x"]
        dy = to_pos["y"] - from_pos["y"]
        return math.atan2(dy, dx)

    def _normalize_angle(self, angle: float) -> float:
        """Normalize angle to [-PI, PI]"""
        while angle > math.pi:
            angle -= 2 * math.pi
        while angle < -math.pi:
            angle += 2 * math.pi
        return angle


# Export for use
def create_custom_bot(bot_id: str, difficulty: str = "medium"):
    """Factory function to create a custom bot"""
    return CustomBot(bot_id, difficulty)


# Example of how to use this bot:
# Replace the SimpleBot in ai/bot.py with this CustomBot
# Or modify the bot factory to allow choosing different bot types
