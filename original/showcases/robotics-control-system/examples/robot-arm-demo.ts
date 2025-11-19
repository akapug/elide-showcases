/**
 * Robot Arm Demonstration Examples
 *
 * Shows various robot arm control scenarios using Elide's polyglot capabilities
 */

import { RobotArm, RobotArmConfigs } from '../src/robots/robot-arm';
import { PathPlanner } from '../src/planning/path-planner';
import { TrajectoryGenerator } from '../src/planning/trajectory-generator';
import { RobotSimulator } from '../src/simulation/simulator';
import { Vector3, Obstacle } from '../src/types';

/**
 * Example 1: Basic Forward and Inverse Kinematics
 */
async function basicKinematicsExample() {
  console.log('\n=== Basic Kinematics Example ===\n');

  // Create UR5 robot arm
  const robot = new RobotArm(RobotArmConfigs.UR5);

  // Set joint angles
  const jointAngles = [0, -Math.PI / 4, Math.PI / 2, 0, Math.PI / 4, 0];
  robot.setJointAngles(jointAngles);

  console.log('Joint Angles:', jointAngles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'));

  // Get end-effector position (forward kinematics)
  const endEffectorPos = robot.getEndEffectorPosition();
  console.log('End-Effector Position:', endEffectorPos);

  // Solve inverse kinematics for target position
  const target: Vector3 = { x: 0.3, y: 0.2, z: 0.4 };
  console.log('\nTarget Position:', target);

  try {
    const solution = await robot.solveInverseKinematics(target, {
      method: 'jacobian',
      tolerance: 0.001
    });

    console.log('IK Solution (deg):', solution.map(a => (a * 180 / Math.PI).toFixed(2) + '°'));

    // Verify solution
    robot.setJointAngles(solution);
    const achievedPos = robot.getEndEffectorPosition();
    const error = Math.sqrt(
      Math.pow(achievedPos.x - target.x, 2) +
      Math.pow(achievedPos.y - target.y, 2) +
      Math.pow(achievedPos.z - target.z, 2)
    );

    console.log('Achieved Position:', achievedPos);
    console.log('Position Error:', error.toFixed(6), 'm');
  } catch (error) {
    console.error('IK failed:', error);
  }
}

/**
 * Example 2: Pick and Place Task
 */
async function pickAndPlaceExample() {
  console.log('\n=== Pick and Place Example ===\n');

  const robot = new RobotArm(RobotArmConfigs.UR5);

  // Define pick and place locations
  const pickPosition: Vector3 = { x: 0.4, y: 0.2, z: 0.1 };
  const placePosition: Vector3 = { x: -0.3, y: 0.3, z: 0.25 };
  const homePosition: Vector3 = { x: 0, y: 0.5, z: 0.3 };

  console.log('Pick Position:', pickPosition);
  console.log('Place Position:', placePosition);

  // Move to home position
  console.log('\n1. Moving to home position...');
  await robot.moveToPosition(homePosition, {
    controller: 'pid',
    maxVelocity: 1.0
  });
  console.log('Reached home position');

  // Move to pick position
  console.log('\n2. Moving to pick position...');
  await robot.moveToPosition(pickPosition, {
    controller: 'pid',
    maxVelocity: 0.5
  });
  console.log('Reached pick position');

  // Grasp object
  console.log('\n3. Grasping object...');
  await robot.closeGripper();

  // Move to place position
  console.log('\n4. Moving to place position...');
  await robot.moveToPosition(placePosition, {
    controller: 'pid',
    maxVelocity: 0.8
  });
  console.log('Reached place position');

  // Release object
  console.log('\n5. Releasing object...');
  await robot.openGripper();

  // Return to home
  console.log('\n6. Returning to home...');
  await robot.moveToPosition(homePosition, {
    controller: 'pid',
    maxVelocity: 1.0
  });
  console.log('Returned to home');

  console.log('\nPick and place complete!');
}

/**
 * Example 3: Trajectory Following with PID Control
 */
async function trajectoryFollowingExample() {
  console.log('\n=== Trajectory Following Example ===\n');

  const robot = new RobotArm(RobotArmConfigs.UR5);
  const trajGen = new TrajectoryGenerator({
    interpolationType: 'cubic-spline',
    maxVelocity: 1.0,
    maxAcceleration: 2.0
  });

  // Define waypoints for circular motion
  const waypoints = [];
  const radius = 0.3;
  const center = { x: 0.3, y: 0, z: 0.3 };
  const numPoints = 8;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    waypoints.push({
      position: {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        z: center.z
      },
      time: i * 0.5
    });
  }

  console.log(`Generated ${waypoints.length} waypoints for circular trajectory`);

  // Generate smooth trajectory
  const trajectory = trajGen.generate(waypoints);

  console.log('Trajectory Duration:', trajectory.duration.toFixed(2), 's');
  console.log('Trajectory Length:', trajectory.length.toFixed(3), 'm');
  console.log('Max Velocity:', trajectory.maxVelocity.toFixed(3), 'm/s');
  console.log('Max Acceleration:', trajectory.maxAcceleration.toFixed(3), 'm/s²');

  // Follow trajectory
  console.log('\nFollowing trajectory...');
  await robot.followTrajectory(trajectory, {
    controller: 'pid'
  });

  console.log('Trajectory complete!');
}

/**
 * Example 4: Model Predictive Control
 */
async function mpcControlExample() {
  console.log('\n=== Model Predictive Control Example ===\n');

  const robot = new RobotArm(RobotArmConfigs.UR5);

  // Define reference trajectory
  const target: Vector3 = { x: 0.4, y: 0.3, z: 0.5 };

  console.log('Target Position:', target);
  console.log('Using MPC with 20-step prediction horizon...');

  // Move with MPC
  await robot.moveToPosition(target, {
    controller: 'mpc',
    maxVelocity: 0.8,
    maxAcceleration: 2.0
  });

  const achievedPos = robot.getEndEffectorPosition();
  console.log('Achieved Position:', achievedPos);

  const error = Math.sqrt(
    Math.pow(achievedPos.x - target.x, 2) +
    Math.pow(achievedPos.y - target.y, 2) +
    Math.pow(achievedPos.z - target.z, 2)
  );

  console.log('Position Error:', error.toFixed(6), 'm');
}

/**
 * Example 5: Workspace Analysis
 */
function workspaceAnalysisExample() {
  console.log('\n=== Workspace Analysis Example ===\n');

  const robot = new RobotArm(RobotArmConfigs.UR5);

  console.log('Computing workspace boundary (this may take a moment)...');

  const workspacePoints = robot.computeWorkspace(8);

  console.log(`Workspace contains ${workspacePoints.length} sampled points`);

  // Find workspace bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const point of workspacePoints) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  }

  console.log('\nWorkspace Bounds:');
  console.log('  X:', minX.toFixed(3), 'to', maxX.toFixed(3), 'm');
  console.log('  Y:', minY.toFixed(3), 'to', maxY.toFixed(3), 'm');
  console.log('  Z:', minZ.toFixed(3), 'to', maxZ.toFixed(3), 'm');

  const volume = (maxX - minX) * (maxY - minY) * (maxZ - minZ);
  console.log('\nApproximate Workspace Volume:', volume.toFixed(3), 'm³');
}

/**
 * Example 6: Singularity Avoidance
 */
async function singularityAvoidanceExample() {
  console.log('\n=== Singularity Avoidance Example ===\n');

  const robot = new RobotArm(RobotArmConfigs.UR5);

  // Test configurations
  const configurations = [
    [0, 0, 0, 0, 0, 0],
    [Math.PI / 4, -Math.PI / 3, Math.PI / 2, 0, Math.PI / 4, 0],
    [0, -Math.PI / 2, Math.PI, 0, 0, 0] // Potential singularity
  ];

  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    robot.setJointAngles(config);

    const manipulability = robot.computeManipulability();
    const isSingular = robot.isAtSingularity(0.01);

    console.log(`\nConfiguration ${i + 1}:`);
    console.log('  Joint Angles (deg):', config.map(a => (a * 180 / Math.PI).toFixed(1)));
    console.log('  Manipulability:', manipulability.toFixed(6));
    console.log('  At Singularity:', isSingular ? 'YES' : 'NO');

    if (isSingular) {
      console.log('  ⚠️ Warning: Robot is near singularity!');
    }
  }
}

/**
 * Example 7: Path Planning with Obstacles
 */
async function pathPlanningExample() {
  console.log('\n=== Path Planning with Obstacles Example ===\n');

  const robot = new RobotArm(RobotArmConfigs.UR5);

  // Define obstacles
  const obstacles: Obstacle[] = [
    {
      type: 'box',
      position: { x: 0.3, y: 0.2, z: 0.3 },
      size: { x: 0.2, y: 0.2, z: 0.4 }
    },
    {
      type: 'sphere',
      position: { x: -0.2, y: 0.4, z: 0.5 },
      radius: 0.15
    }
  ];

  console.log('Obstacles:', obstacles.length);

  // Create path planner
  const planner = new PathPlanner({
    algorithm: 'rrt-star',
    workspace: {
      min: { x: -1, y: -1, z: 0 },
      max: { x: 1, y: 1, z: 1 }
    },
    stepSize: 0.05,
    maxIterations: 5000,
    goalBias: 0.1,
    optimizationRadius: 0.2
  });

  // Plan path
  const start = robot.getEndEffectorPosition();
  const goal: Vector3 = { x: 0.5, y: -0.3, z: 0.6 };

  console.log('\nStart Position:', start);
  console.log('Goal Position:', goal);
  console.log('\nPlanning path (this may take a moment)...');

  try {
    const path = await planner.planPath(start, goal, obstacles);

    console.log('\nPath found!');
    console.log('  Waypoints:', path.waypoints.length);
    console.log('  Total Length:', path.totalLength.toFixed(3), 'm');
    console.log('  Planning Time:', path.planningTime.toFixed(1), 'ms');

    // Optimize path
    const optimizedPath = planner.optimizePath(path, obstacles);
    console.log('\nOptimized path:');
    console.log('  Waypoints:', optimizedPath.waypoints.length);
    console.log('  Total Length:', optimizedPath.totalLength.toFixed(3), 'm');

    // Follow path
    console.log('\nFollowing path...');
    await robot.followPath(optimizedPath, {
      maxVelocity: 0.5,
      maxAcceleration: 1.0
    });

    console.log('Path following complete!');
  } catch (error) {
    console.error('Path planning failed:', error);
  }
}

/**
 * Example 8: Multi-Robot Coordination (Simulation)
 */
async function multiRobotExample() {
  console.log('\n=== Multi-Robot Coordination Example ===\n');

  // Create simulator
  const simulator = new RobotSimulator({
    timestep: 0.001,
    gravity: { x: 0, y: 0, z: -9.81 },
    enableCollision: true,
    realtime: false
  });

  // Add two robots
  const robot1 = new RobotArm({
    ...RobotArmConfigs.UR5,
    name: 'Robot1',
    baseTransform: {
      matrix: [[1, 0, 0, -0.5], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
      rotation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      position: { x: -0.5, y: 0, z: 0 }
    }
  });

  const robot2 = new RobotArm({
    ...RobotArmConfigs.UR5,
    name: 'Robot2',
    baseTransform: {
      matrix: [[1, 0, 0, 0.5], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
      rotation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      position: { x: 0.5, y: 0, z: 0 }
    }
  });

  simulator.addRobot(robot1);
  simulator.addRobot(robot2);

  // Add shared workspace obstacle
  simulator.addObstacle({
    type: 'box',
    position: { x: 0, y: 0.3, z: 0.2 },
    size: { x: 0.3, y: 0.3, z: 0.4 }
  });

  console.log('Simulating coordinated motion...');

  // Run simulation
  await simulator.run(5.0);

  const finalState = simulator.getState();
  console.log('\nSimulation complete!');
  console.log('  Time:', finalState.time.toFixed(3), 's');
  console.log('  Contacts:', finalState.contacts.length);
  console.log('  Total Energy:', finalState.energy.toFixed(3), 'J');
}

/**
 * Example 9: Assembly Task
 */
async function assemblyTaskExample() {
  console.log('\n=== Assembly Task Example ===\n');

  const robot = new RobotArm(RobotArmConfigs.UR5);

  // Assembly task: Insert peg into hole
  const pegPickup: Vector3 = { x: 0.4, y: 0.3, z: 0.1 };
  const holePosition: Vector3 = { x: -0.3, y: -0.2, z: 0.15 };
  const approachHeight = 0.1;

  console.log('Assembly task: Peg insertion');
  console.log('Peg Position:', pegPickup);
  console.log('Hole Position:', holePosition);

  // Step 1: Pick up peg
  console.log('\n1. Moving to peg...');
  await robot.moveToPosition(pegPickup, { maxVelocity: 0.5 });
  await robot.closeGripper();
  console.log('Peg grasped');

  // Step 2: Lift peg
  console.log('\n2. Lifting peg...');
  await robot.moveToPosition(
    { x: pegPickup.x, y: pegPickup.y, z: pegPickup.z + approachHeight },
    { maxVelocity: 0.3 }
  );

  // Step 3: Move to approach position above hole
  console.log('\n3. Moving to approach position...');
  await robot.moveToPosition(
    { x: holePosition.x, y: holePosition.y, z: holePosition.z + approachHeight },
    { maxVelocity: 0.5 }
  );

  // Step 4: Slow insertion
  console.log('\n4. Inserting peg (slow and precise)...');
  await robot.moveToPosition(holePosition, {
    controller: 'mpc',
    maxVelocity: 0.05, // Very slow for precision
    maxAcceleration: 0.1
  });

  // Step 5: Release
  console.log('\n5. Releasing peg...');
  await robot.openGripper();

  console.log('\nAssembly task complete!');
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   Robot Arm Control Examples - Elide Polyglot Demo   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    await basicKinematicsExample();
    await pickAndPlaceExample();
    await trajectoryFollowingExample();
    await mpcControlExample();
    workspaceAnalysisExample();
    await singularityAvoidanceExample();
    await pathPlanningExample();
    await multiRobotExample();
    await assemblyTaskExample();

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
  basicKinematicsExample,
  pickAndPlaceExample,
  trajectoryFollowingExample,
  mpcControlExample,
  workspaceAnalysisExample,
  singularityAvoidanceExample,
  pathPlanningExample,
  multiRobotExample,
  assemblyTaskExample
};
