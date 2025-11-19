/**
 * Path Planning Demonstration Examples
 *
 * Shows various path planning algorithms and scenarios
 */

import { PathPlanner } from '../src/planning/path-planner';
import { MobileRobot, MobileRobotConfigs } from '../src/robots/mobile-robot';
import { Vector3, Obstacle, PathPlanningAlgorithm } from '../src/types';

/**
 * Example 1: RRT Path Planning
 */
async function rrtExample() {
  console.log('\n=== RRT Path Planning Example ===\n');

  const planner = new PathPlanner({
    algorithm: 'rrt',
    workspace: {
      min: { x: -5, y: -5, z: 0 },
      max: { x: 5, y: 5, z: 1 }
    },
    stepSize: 0.2,
    maxIterations: 1000,
    goalBias: 0.1
  });

  const obstacles: Obstacle[] = [
    { type: 'box', position: { x: 0, y: 0, z: 0 }, size: { x: 1, y: 1, z: 1 } },
    { type: 'sphere', position: { x: 2, y: 2, z: 0.5 }, radius: 0.5 },
    { type: 'cylinder', position: { x: -2, y: 1, z: 0 }, radius: 0.4, height: 1 }
  ];

  const start: Vector3 = { x: -4, y: -4, z: 0.5 };
  const goal: Vector3 = { x: 4, y: 4, z: 0.5 };

  console.log('Start:', start);
  console.log('Goal:', goal);
  console.log('Obstacles:', obstacles.length);

  console.log('\nPlanning with RRT...');
  const path = await planner.planPath(start, goal, obstacles);

  console.log('\nPath found!');
  console.log('  Waypoints:', path.waypoints.length);
  console.log('  Total Length:', path.totalLength.toFixed(2), 'm');
  console.log('  Planning Time:', path.planningTime.toFixed(2), 'ms');
}

/**
 * Example 2: RRT* Path Planning (Optimal)
 */
async function rrtStarExample() {
  console.log('\n=== RRT* Path Planning Example ===\n');

  const planner = new PathPlanner({
    algorithm: 'rrt-star',
    workspace: {
      min: { x: -5, y: -5, z: 0 },
      max: { x: 5, y: 5, z: 1 }
    },
    stepSize: 0.15,
    maxIterations: 5000,
    goalBias: 0.05,
    optimizationRadius: 0.5
  });

  const obstacles: Obstacle[] = [
    { type: 'box', position: { x: 1, y: 0, z: 0 }, size: { x: 0.5, y: 2, z: 1 } },
    { type: 'box', position: { x: -1, y: 0, z: 0 }, size: { x: 0.5, y: 2, z: 1 } }
  ];

  const start: Vector3 = { x: -3, y: 0, z: 0.5 };
  const goal: Vector3 = { x: 3, y: 0, z: 0.5 };

  console.log('Planning with RRT* for optimal path...');
  const path = await planner.planPath(start, goal, obstacles);

  console.log('\nOptimal path found!');
  console.log('  Waypoints:', path.waypoints.length);
  console.log('  Total Length:', path.totalLength.toFixed(2), 'm');
  console.log('  Path Cost:', path.cost?.toFixed(2));
  console.log('  Planning Time:', path.planningTime.toFixed(2), 'ms');

  // Optimize further
  const optimized = planner.optimizePath(path, obstacles);
  console.log('\nAfter smoothing:');
  console.log('  Waypoints:', optimized.waypoints.length);
  console.log('  Total Length:', optimized.totalLength.toFixed(2), 'm');
}

/**
 * Example 3: A* Grid-Based Planning
 */
async function aStarExample() {
  console.log('\n=== A* Path Planning Example ===\n');

  const planner = new PathPlanner({
    algorithm: 'a-star',
    workspace: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 10, y: 10, z: 1 }
    },
    stepSize: 0.1,
    maxIterations: 10000
  });

  // Create maze-like environment
  const obstacles: Obstacle[] = [
    { type: 'box', position: { x: 2, y: 5, z: 0 }, size: { x: 0.2, y: 8, z: 1 } },
    { type: 'box', position: { x: 5, y: 5, z: 0 }, size: { x: 0.2, y: 6, z: 1 } },
    { type: 'box', position: { x: 8, y: 5, z: 0 }, size: { x: 0.2, y: 8, z: 1 } }
  ];

  const start: Vector3 = { x: 1, y: 5, z: 0.5 };
  const goal: Vector3 = { x: 9, y: 5, z: 0.5 };

  console.log('Planning through maze with A*...');
  const path = await planner.planPath(start, goal, obstacles);

  console.log('\nPath found through maze!');
  console.log('  Waypoints:', path.waypoints.length);
  console.log('  Total Length:', path.totalLength.toFixed(2), 'm');
  console.log('  Planning Time:', path.planningTime.toFixed(2), 'ms');
}

/**
 * Example 4: Mobile Robot Navigation
 */
async function mobileRobotNavigationExample() {
  console.log('\n=== Mobile Robot Navigation Example ===\n');

  const robot = new MobileRobot(MobileRobotConfigs.TurtleBot3);
  robot.setPose({ x: 0, y: 0, theta: 0 });

  console.log('Robot: TurtleBot3');
  console.log('Initial Pose:', robot.getPose());

  // Plan path to goal
  const planner = new PathPlanner({
    algorithm: 'rrt-star',
    workspace: {
      min: { x: -5, y: -5, z: 0 },
      max: { x: 5, y: 5, z: 0 }
    },
    stepSize: 0.2,
    maxIterations: 2000
  });

  const obstacles: Obstacle[] = [
    { type: 'box', position: { x: 2, y: 1, z: 0 }, size: { x: 1, y: 1, z: 1 } },
    { type: 'sphere', position: { x: -1, y: 2, z: 0 }, radius: 0.5 }
  ];

  const start: Vector3 = { x: 0, y: 0, z: 0 };
  const goal: Vector3 = { x: 4, y: 3, z: 0 };

  console.log('\nPlanning path...');
  const path = await planner.planPath(start, goal, obstacles);

  console.log('Path planned!');
  console.log('  Length:', path.totalLength.toFixed(2), 'm');
  console.log('  Waypoints:', path.waypoints.length);

  // Follow path
  console.log('\nFollowing path...');
  await robot.followPath(path, {
    lookaheadDistance: 0.3,
    maxLinearVelocity: 0.15,
    maxAngularVelocity: 1.5
  });

  const finalPose = robot.getPose();
  console.log('\nFinal Pose:', finalPose);
  console.log('Distance to goal:', Math.sqrt(
    Math.pow(finalPose.x - goal.x, 2) +
    Math.pow(finalPose.y - goal.y, 2)
  ).toFixed(3), 'm');
}

/**
 * Example 5: Dynamic Replanning
 */
async function dynamicReplanningExample() {
  console.log('\n=== Dynamic Replanning Example ===\n');

  const robot = new MobileRobot(MobileRobotConfigs.Pioneer3DX);
  robot.setPose({ x: 0, y: 0, theta: 0 });

  const planner = new PathPlanner({
    algorithm: 'rrt',
    workspace: {
      min: { x: -10, y: -10, z: 0 },
      max: { x: 10, y: 10, z: 0 }
    },
    stepSize: 0.3,
    maxIterations: 1000
  });

  // Static obstacles
  let obstacles: Obstacle[] = [
    { type: 'box', position: { x: 3, y: 2, z: 0 }, size: { x: 1, y: 1, z: 1 } }
  ];

  const goal: Vector3 = { x: 8, y: 8, z: 0 };

  console.log('Planning initial path...');
  let currentPath = await planner.planPath(
    { x: robot.getPose().x, y: robot.getPose().y, z: 0 },
    goal,
    obstacles
  );

  console.log('Initial path length:', currentPath.totalLength.toFixed(2), 'm');

  // Simulate navigation with dynamic obstacle
  for (let step = 0; step < 5; step++) {
    console.log(`\nStep ${step + 1}:`);

    // Follow path segment
    if (currentPath.waypoints.length > 1) {
      const nextWaypoint = currentPath.waypoints[1];
      const target = { x: nextWaypoint.position.x, y: nextWaypoint.position.y };

      const control = robot.computePurePursuitControl(target, 0.5, 0.8);
      robot.setVelocity(control.linear, control.angular);
      robot.updateOdometry(0.1);

      console.log('  Position:', robot.getPose());
    }

    // Dynamic obstacle appears at step 3
    if (step === 2) {
      console.log('  ⚠️ New obstacle detected!');
      obstacles.push({
        type: 'sphere',
        position: { x: 5, y: 5, z: 0 },
        radius: 1.0
      });

      // Replan
      console.log('  Replanning...');
      currentPath = await planner.planPath(
        { x: robot.getPose().x, y: robot.getPose().y, z: 0 },
        goal,
        obstacles
      );

      console.log('  New path length:', currentPath.totalLength.toFixed(2), 'm');
    }
  }

  console.log('\nDynamic navigation complete!');
}

/**
 * Example 6: Algorithm Comparison
 */
async function algorithmComparisonExample() {
  console.log('\n=== Algorithm Comparison Example ===\n');

  const algorithms: PathPlanningAlgorithm[] = ['rrt', 'rrt-star', 'a-star'];
  const results: { algorithm: string; time: number; length: number; waypoints: number }[] = [];

  const obstacles: Obstacle[] = [
    { type: 'box', position: { x: 2, y: 2, z: 0 }, size: { x: 1, y: 1, z: 1 } },
    { type: 'box', position: { x: 5, y: 5, z: 0 }, size: { x: 1.5, y: 1.5, z: 1 } },
    { type: 'sphere', position: { x: 8, y: 3, z: 0 }, radius: 0.8 }
  ];

  const start: Vector3 = { x: 0, y: 0, z: 0.5 };
  const goal: Vector3 = { x: 10, y: 10, z: 0.5 };

  console.log('Testing algorithms on same problem...');
  console.log('Start:', start);
  console.log('Goal:', goal);
  console.log('Obstacles:', obstacles.length);

  for (const algorithm of algorithms) {
    console.log(`\nTesting ${algorithm.toUpperCase()}...`);

    const planner = new PathPlanner({
      algorithm,
      workspace: {
        min: { x: -1, y: -1, z: 0 },
        max: { x: 11, y: 11, z: 1 }
      },
      stepSize: algorithm === 'a-star' ? 0.1 : 0.2,
      maxIterations: algorithm === 'rrt' ? 1000 : 5000
    });

    try {
      const path = await planner.planPath(start, goal, obstacles);

      results.push({
        algorithm,
        time: path.planningTime,
        length: path.totalLength,
        waypoints: path.waypoints.length
      });

      console.log('  ✓ Success');
      console.log('    Time:', path.planningTime.toFixed(2), 'ms');
      console.log('    Length:', path.totalLength.toFixed(2), 'm');
      console.log('    Waypoints:', path.waypoints.length);
    } catch (error) {
      console.log('  ✗ Failed');
    }
  }

  console.log('\n=== Comparison Summary ===');
  console.log('Algorithm       Time (ms)   Length (m)   Waypoints');
  console.log('─────────────────────────────────────────────────────');

  for (const result of results) {
    console.log(
      `${result.algorithm.padEnd(15)} ` +
      `${result.time.toFixed(2).padStart(8)}    ` +
      `${result.length.toFixed(2).padStart(8)}    ` +
      `${result.waypoints.toString().padStart(7)}`
    );
  }
}

/**
 * Example 7: Warehouse Navigation Scenario
 */
async function warehouseNavigationExample() {
  console.log('\n=== Warehouse Navigation Example ===\n');

  const robot = new MobileRobot(MobileRobotConfigs.Pioneer3DX);

  // Warehouse layout with shelving
  const obstacles: Obstacle[] = [
    // Shelving rows
    { type: 'box', position: { x: 2, y: 5, z: 0 }, size: { x: 4, y: 0.5, z: 2 } },
    { type: 'box', position: { x: 2, y: 8, z: 0 }, size: { x: 4, y: 0.5, z: 2 } },
    { type: 'box', position: { x: 2, y: 11, z: 0 }, size: { x: 4, y: 0.5, z: 2 } },
    { type: 'box', position: { x: 8, y: 5, z: 0 }, size: { x: 4, y: 0.5, z: 2 } },
    { type: 'box', position: { x: 8, y: 8, z: 0 }, size: { x: 4, y: 0.5, z: 2 } },
    { type: 'box', position: { x: 8, y: 11, z: 0 }, size: { x: 4, y: 0.5, z: 2 } }
  ];

  const pickupLocations = [
    { x: 1, y: 5, z: 0 },
    { x: 3, y: 8, z: 0 },
    { x: 7, y: 11, z: 0 }
  ];

  const dropoffLocation: Vector3 = { x: 10, y: 1, z: 0 };

  console.log('Warehouse robot delivery task');
  console.log('Pickup locations:', pickupLocations.length);

  const planner = new PathPlanner({
    algorithm: 'a-star',
    workspace: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 12, y: 14, z: 0 }
    },
    stepSize: 0.1,
    maxIterations: 10000
  });

  let totalDistance = 0;
  let totalTime = 0;
  let currentPos: Vector3 = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < pickupLocations.length; i++) {
    const pickup = pickupLocations[i];

    console.log(`\nDelivery ${i + 1}:`);

    // Go to pickup
    console.log('  Planning to pickup...');
    const pathToPickup = await planner.planPath(currentPos, pickup, obstacles);
    totalDistance += pathToPickup.totalLength;
    totalTime += pathToPickup.planningTime;

    console.log(`    Distance: ${pathToPickup.totalLength.toFixed(2)} m`);

    // Go to dropoff
    console.log('  Planning to dropoff...');
    const pathToDropoff = await planner.planPath(pickup, dropoffLocation, obstacles);
    totalDistance += pathToDropoff.totalLength;
    totalTime += pathToDropoff.planningTime;

    console.log(`    Distance: ${pathToDropoff.totalLength.toFixed(2)} m`);

    currentPos = dropoffLocation;
  }

  console.log('\n=== Task Complete ===');
  console.log('Total Distance:', totalDistance.toFixed(2), 'm');
  console.log('Total Planning Time:', totalTime.toFixed(2), 'ms');
  console.log('Deliveries:', pickupLocations.length);
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     Path Planning Examples - Elide Polyglot Demo     ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    await rrtExample();
    await rrtStarExample();
    await aStarExample();
    await mobileRobotNavigationExample();
    await dynamicReplanningExample();
    await algorithmComparisonExample();
    await warehouseNavigationExample();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║            All Examples Completed Successfully!       ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (require.main === module) {
  main();
}

export {
  rrtExample,
  rrtStarExample,
  aStarExample,
  mobileRobotNavigationExample,
  dynamicReplanningExample,
  algorithmComparisonExample,
  warehouseNavigationExample
};
