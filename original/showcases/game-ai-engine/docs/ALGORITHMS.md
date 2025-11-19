# Game AI Algorithms Documentation

**Comprehensive guide to reinforcement learning algorithms implemented in the Game AI Engine showcase.**

This document covers the theory, implementation details, and usage of all RL algorithms in this project, demonstrating Elide's unique ability to seamlessly integrate Python ML libraries (PyTorch, NumPy, OpenAI Gym) with TypeScript!

---

## Table of Contents

1. [Deep Q-Network (DQN)](#deep-q-network-dqn)
2. [Proximal Policy Optimization (PPO)](#proximal-policy-optimization-ppo)
3. [Asynchronous Advantage Actor-Critic (A3C)](#asynchronous-advantage-actor-critic-a3c)
4. [Monte Carlo Tree Search (MCTS)](#monte-carlo-tree-search-mcts)
5. [Neural Network Architectures](#neural-network-architectures)
6. [Environment Wrappers](#environment-wrappers)
7. [Training Strategies](#training-strategies)
8. [Performance Optimization](#performance-optimization)

---

## Deep Q-Network (DQN)

### Overview

Deep Q-Network (DQN) is a value-based reinforcement learning algorithm that combines Q-learning with deep neural networks. It was introduced by DeepMind in 2013 and achieved human-level performance on Atari games.

### Key Concepts

**Q-Learning Update Rule:**
```
Q(s, a) ← Q(s, a) + α[r + γ max Q(s', a') - Q(s, a)]
```

Where:
- `s` = current state
- `a` = action taken
- `r` = reward received
- `s'` = next state
- `α` = learning rate
- `γ` = discount factor

**Loss Function:**
```
L = E[(r + γ max Q(s', a'; θ⁻) - Q(s, a; θ))²]
```

Where `θ` are the network parameters and `θ⁻` are the target network parameters.

### Implementation Features

Our DQN implementation includes several enhancements:

#### 1. Experience Replay

Stores transitions `(s, a, r, s', done)` in a replay buffer and samples random batches for training.

**Benefits:**
- Breaks correlation between consecutive samples
- Improves data efficiency
- Stabilizes training

**Code Example:**
```typescript
// Store experience in replay buffer
agent.remember(state, action, reward, nextState, done);

// Sample random batch and train
if (agent.getMemorySize() >= batchSize) {
  const metrics = agent.train();
}
```

#### 2. Target Network

Maintains a separate target network with frozen parameters, updated periodically.

**Benefits:**
- Reduces oscillations in Q-value estimates
- Stabilizes training
- Prevents divergence

**Update Frequency:** Every 1000 training steps (configurable)

#### 3. Double DQN

Uses the online network to select actions and the target network to evaluate them.

**Standard DQN:**
```
Y = r + γ max Q(s', a'; θ⁻)
```

**Double DQN:**
```
Y = r + γ Q(s', argmax Q(s', a; θ); θ⁻)
```

**Benefits:**
- Reduces overestimation bias
- More accurate Q-value estimates
- Better performance

#### 4. Dueling DQN

Splits Q-network into value stream and advantage stream.

**Architecture:**
```
Q(s, a) = V(s) + [A(s, a) - mean(A(s, a))]
```

Where:
- `V(s)` = state value function
- `A(s, a)` = advantage function

**Benefits:**
- Better representation of state values
- Faster learning
- Improved generalization

#### 5. Prioritized Experience Replay

Samples important transitions more frequently based on TD error.

**Priority:**
```
p_i = |δ_i| + ε
```

Where `δ_i` is the TD error and `ε` is a small constant.

**Sampling Probability:**
```
P(i) = p_i^α / Σ_k p_k^α
```

**Importance Sampling Weights:**
```
w_i = (N · P(i))^(-β)
```

### Hyperparameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Learning Rate | 0.00025 | Step size for gradient descent |
| Discount (γ) | 0.99 | Future reward discount factor |
| Epsilon (ε) | 1.0 → 0.01 | Exploration rate (decays) |
| Batch Size | 32 | Number of samples per training step |
| Memory Size | 100,000 | Replay buffer capacity |
| Target Update Freq | 1000 | Steps between target network updates |

### Usage Example

```typescript
import { DQNAgent } from './src/algorithms/dqn.ts';
import { createCartPole } from './src/environments/gym-wrapper.ts';

// Create agent
const agent = new DQNAgent({
  stateShape: [4],
  actionSize: 2,
  learningRate: 0.001,
  discount: 0.99,
  doubleDQN: true,
  duelingDQN: true,
  device: 'cpu',
});

// Create environment
const env = createCartPole();

// Training loop
for (let episode = 0; episode < 1000; episode++) {
  let state = env.reset();
  let done = false;

  while (!done) {
    const action = agent.selectAction(state);
    const result = env.step(action);

    agent.remember(state, action, result.reward, result.observation, result.done);
    agent.train();

    state = result.observation;
    done = result.done;
  }
}
```

### Performance Tips

1. **Warmup Steps:** Wait for replay buffer to fill before training
2. **Epsilon Decay:** Gradually reduce exploration over time
3. **Target Network Updates:** Balance stability vs. learning speed
4. **Batch Size:** Larger batches = more stable gradients
5. **Network Architecture:** Match complexity to problem difficulty

---

## Proximal Policy Optimization (PPO)

### Overview

PPO is a policy gradient method that optimizes a "surrogate" objective while keeping the policy update step bounded. It's one of the most popular RL algorithms due to its simplicity and effectiveness.

### Key Concepts

**Policy Gradient Objective:**
```
L^PG = E_t[log π(a_t|s_t) Â_t]
```

**Clipped Surrogate Objective:**
```
L^CLIP = E_t[min(r_t(θ) Â_t, clip(r_t(θ), 1-ε, 1+ε) Â_t)]
```

Where:
- `r_t(θ) = π(a_t|s_t; θ) / π(a_t|s_t; θ_old)` (probability ratio)
- `Â_t` = advantage estimate
- `ε` = clip parameter (typically 0.2)

**Total Loss:**
```
L = L^CLIP - c_1 L^VF + c_2 H[π]
```

Where:
- `L^VF` = value function loss
- `H[π]` = entropy bonus (for exploration)
- `c_1`, `c_2` = coefficients

### Implementation Features

#### 1. Actor-Critic Architecture

Separate networks for policy (actor) and value function (critic).

**Actor Network:**
- Input: State
- Output: Action probabilities (discrete) or mean/std (continuous)

**Critic Network:**
- Input: State
- Output: State value estimate

#### 2. Generalized Advantage Estimation (GAE)

Computes advantage estimates with bias-variance tradeoff.

**GAE Formula:**
```
Â_t = δ_t + (γλ)δ_{t+1} + (γλ)²δ_{t+2} + ...
```

Where:
- `δ_t = r_t + γV(s_{t+1}) - V(s_t)` (TD error)
- `λ` = GAE parameter (0 = high bias, 1 = high variance)

**Benefits:**
- Reduces variance
- Maintains low bias
- Improves learning stability

#### 3. Multiple Update Epochs

Performs multiple gradient updates on same batch of data.

**Process:**
1. Collect trajectory of length T
2. Compute advantages using GAE
3. For K epochs:
   - Shuffle data
   - Update policy and value networks
   - Monitor KL divergence

**Benefits:**
- Better data efficiency
- More stable updates
- Faster convergence

#### 4. Value Function Clipping

Clips value function updates to prevent large changes.

**Clipped Value Loss:**
```
L^VF = max((V(s) - V_target)², (V_clip(s) - V_target)²)
```

Where `V_clip(s) = V_old(s) + clip(V(s) - V_old(s), -ε, ε)`

### Hyperparameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Actor LR | 0.0003 | Learning rate for policy network |
| Critic LR | 0.001 | Learning rate for value network |
| Discount (γ) | 0.99 | Future reward discount |
| GAE λ | 0.95 | Advantage estimation parameter |
| Clip Ratio (ε) | 0.2 | PPO clip parameter |
| Entropy Coef | 0.01 | Entropy bonus coefficient |
| Value Coef | 0.5 | Value loss coefficient |
| Update Epochs | 10 | Epochs per trajectory |
| Trajectory Size | 2048 | Steps before update |

### Usage Example

```typescript
import { PPOAgent } from './src/algorithms/ppo.ts';

const agent = new PPOAgent({
  stateShape: [4],
  actionSize: 2,
  continuous: false,
  learningRateActor: 0.0003,
  learningRateCritic: 0.001,
  gaeλ: 0.95,
  clipRatio: 0.2,
  updateEpochs: 10,
  trajectorySize: 2048,
});

// Collect trajectory
while (!agent.isReadyToUpdate()) {
  const { action, value } = agent.selectAction(state);
  const result = env.step(action);
  agent.storeReward(result.reward, result.done);
  state = result.observation;
}

// Update policy
const metrics = agent.update();
console.log(`Loss: ${metrics.totalLoss.toFixed(4)}`);
```

### Performance Tips

1. **Trajectory Size:** Larger = better advantage estimates
2. **Update Epochs:** Monitor KL divergence to avoid over-updating
3. **Learning Rates:** Critic usually needs higher LR than actor
4. **Normalization:** Normalize observations and advantages
5. **Entropy Bonus:** Prevents premature convergence

---

## Asynchronous Advantage Actor-Critic (A3C)

### Overview

A3C uses multiple parallel workers to collect experience and update a shared global network asynchronously. This approach provides diversity in training data and speeds up learning.

### Key Concepts

**Architecture:**
- Global shared network (actor-critic)
- Multiple worker threads
- Asynchronous gradient updates
- No experience replay needed

**Update Formula:**
```
θ ← θ + α∇θ log π(a_t|s_t; θ)(R_t - V(s_t; θ))
```

Where `R_t` is the n-step return:
```
R_t = r_t + γr_{t+1} + ... + γ^{n-1}r_{t+n-1} + γ^n V(s_{t+n})
```

### Implementation Features

#### 1. Multi-Threading

Runs multiple workers in parallel threads, each with:
- Local network (copy of global)
- Own environment instance
- Independent exploration

**Benefits:**
- Parallel experience collection
- Diverse training data
- Faster learning
- Better exploration

#### 2. Shared Global Network

All workers share and update the same global network.

**Update Process:**
1. Worker computes gradients on local network
2. Transfers gradients to global network
3. Applies gradient update to global network
4. Syncs local network with updated global network

#### 3. N-Step Returns

Uses n-step returns instead of 1-step TD.

**Benefits:**
- Reduces bias
- Faster credit assignment
- Better bootstrapping

**Typical n:** 5-20 steps

#### 4. Entropy Regularization

Adds entropy bonus to prevent premature convergence.

**Entropy Bonus:**
```
H[π(·|s)] = -Σ_a π(a|s) log π(a|s)
```

### Hyperparameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Num Workers | 4 | Parallel worker threads |
| Learning Rate | 0.0001 | Global network LR |
| Discount (γ) | 0.99 | Reward discount |
| N-Step | 5 | Steps for n-step returns |
| Entropy Coef | 0.01 | Entropy bonus |
| Max Grad Norm | 40.0 | Gradient clipping threshold |

### Usage Example

```typescript
import { A3CAgent } from './src/algorithms/a3c.ts';

const agent = new A3CAgent({
  stateShape: [4],
  actionSize: 2,
  numWorkers: 4,
  learningRate: 0.0001,
  nStep: 5,
  device: 'cpu',
});

// Each worker runs this loop
async function workerLoop(workerId: number) {
  const worker = agent.getWorker(workerId);

  for (let episode = 0; episode < maxEpisodes; episode++) {
    let state = env.reset();
    const trajectory = collectTrajectory(worker, env, state);
    worker.train(trajectory);
  }
}

// Start all workers
await Promise.all(
  Array.from({ length: 4 }, (_, i) => workerLoop(i))
);
```

### Performance Tips

1. **Num Workers:** Balance parallelism with overhead (4-16 typical)
2. **Update Frequency:** More frequent updates = more overhead
3. **N-Step:** Larger n reduces bias but increases variance
4. **Learning Rate:** Lower LR for stability with async updates
5. **Environment Diversity:** Different seeds for each worker

---

## Monte Carlo Tree Search (MCTS)

### Overview

MCTS is a best-first search algorithm that builds a search tree by repeatedly simulating episodes from the current state. It's particularly effective for games with large state spaces.

### Key Concepts

**Four Phases:**

1. **Selection:** Traverse tree using UCT
2. **Expansion:** Add new node to tree
3. **Simulation:** Rollout to terminal state
4. **Backpropagation:** Update values up the tree

**Upper Confidence Bound for Trees (UCT):**
```
UCT(node) = Q(node) + c√(ln(N(parent)) / N(node))
```

Where:
- `Q(node)` = average value
- `N(node)` = visit count
- `c` = exploration constant (typically √2)

### Implementation Features

#### 1. UCT Selection

Balances exploitation (high Q) vs exploration (low N).

**Selection Strategy:**
- If node unvisited → select it
- Otherwise → select child with highest UCT value

#### 2. Neural Network Integration (AlphaZero-style)

Uses neural network for:
- Policy priors: `P(s, a)` (action probabilities)
- Value estimates: `V(s)` (state values)

**Modified UCT:**
```
UCT(node) = Q(node) + c·P(node)·√(N(parent)) / (1 + N(node))
```

#### 3. Dirichlet Noise

Adds noise to root node for exploration.

**Noisy Prior:**
```
P'(a) = (1 - ε)P(a) + ε·η_a
```

Where `η_a ~ Dir(α)` is Dirichlet noise.

**Typical values:**
- `α = 0.3` (for chess/Go)
- `ε = 0.25`

#### 4. Temperature Sampling

Controls action selection randomness.

**Action Probability:**
```
π(a) ∝ N(s, a)^(1/τ)
```

Where:
- `τ = 1`: Stochastic sampling
- `τ → 0`: Greedy selection

### Hyperparameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Num Simulations | 800 | MCTS simulations per move |
| Exploration C | √2 | UCT exploration constant |
| Dirichlet α | 0.3 | Root noise parameter |
| Temperature τ | 1.0 | Action selection randomness |

### Usage Example

```typescript
import { MCTSAgent, AlphaZeroAgent } from './src/agents/mcts-agent.ts';

// Pure MCTS
const mctsAgent = new MCTSAgent({
  numSimulations: 800,
  explorationConstant: 1.414,
  temperature: 1.0,
});

const action = mctsAgent.search(state, environment);

// AlphaZero-style (with neural network)
const alphaZeroAgent = new AlphaZeroAgent({
  numSimulations: 800,
  explorationConstant: 1.0,
}, neuralNetwork);

// Self-play for training
const trainingData = await alphaZeroAgent.selfPlay(env, numGames);
```

### Performance Tips

1. **Simulations:** More = stronger play, but slower
2. **Exploration C:** Higher = more exploration
3. **Tree Reuse:** Keep tree between moves for efficiency
4. **Virtual Loss:** For parallel MCTS
5. **Early Stopping:** Stop search when clear best move

---

## Neural Network Architectures

### Nature DQN (for Atari)

**Input:** 84×84×4 (stacked grayscale frames)

**Architecture:**
```
Conv2D(32 filters, 8×8, stride 4) → ReLU
Conv2D(64 filters, 4×4, stride 2) → ReLU
Conv2D(64 filters, 3×3, stride 1) → ReLU
Flatten
Dense(512) → ReLU
Dense(num_actions)
```

**Total Parameters:** ~1.6M

### ResNet Feature Extractor

**Residual Block:**
```
Conv2D(3×3) → BatchNorm → ReLU
Conv2D(3×3) → BatchNorm
Add skip connection → ReLU
```

**Full Architecture:**
```
Conv2D(64, 7×7, stride 2)
MaxPool(3×3, stride 2)
ResBlock × 2 (64 filters)
ResBlock × 2 (128 filters, stride 2)
ResBlock × 2 (256 filters, stride 2)
GlobalAvgPool
```

### LSTM Networks

**Architecture:**
```
LSTM(input_size, hidden_size, num_layers)
Dense(hidden_size → output_size)
```

**Benefits:**
- Handles partial observability
- Remembers long-term dependencies
- Processes sequences

**Applications:**
- Partially observable environments
- Temporal credit assignment
- Sequential decision making

---

## Environment Wrappers

### Atari Preprocessing

1. **Frame Skip:** Skip 4 frames, take max over last 2
2. **Grayscale:** Convert RGB to grayscale
3. **Resize:** Downscale to 84×84
4. **Frame Stack:** Stack 4 consecutive frames
5. **Reward Clipping:** Clip to {-1, 0, 1}
6. **Episodic Life:** Treat life loss as episode end

### OpenAI Gym Wrapper

Provides unified interface for:
- Classic control (CartPole, MountainCar)
- Atari games
- Box2D environments
- Custom environments

**Features:**
- Automatic preprocessing
- Vectorized environments
- Monitoring and logging

---

## Training Strategies

### Curriculum Learning

Start with easier tasks, gradually increase difficulty.

**Example:**
1. Train on simple maze
2. Add obstacles
3. Increase maze size
4. Add multiple goals

### Reward Shaping

Design intermediate rewards to guide learning.

**Principles:**
- Potential-based shaping (doesn't change optimal policy)
- Dense rewards (more frequent feedback)
- Normalized rewards (stable training)

### Hyperparameter Tuning

**Key parameters to tune:**
1. Learning rate (most important)
2. Network architecture
3. Batch size
4. Discount factor
5. Exploration parameters

**Strategies:**
- Grid search
- Random search
- Bayesian optimization
- Population-based training

---

## Performance Optimization

### Elide Polyglot Advantages

1. **Zero-Copy Data Sharing:**
   - No serialization overhead
   - Direct memory access
   - Minimal copying

2. **Single Process:**
   - No IPC overhead
   - Lower memory footprint
   - Faster execution

3. **Native Performance:**
   - PyTorch operations at full speed
   - NumPy vectorization
   - Efficient tensor operations

### Training Optimizations

1. **GPU Acceleration:**
   ```typescript
   const agent = new DQNAgent({
     device: 'cuda',  // Use GPU
   });
   ```

2. **Vectorized Environments:**
   ```typescript
   const vecEnv = new VectorizedEnv(envName, numEnvs);
   ```

3. **Batched Forward Passes:**
   - Process multiple states at once
   - Better GPU utilization

4. **Mixed Precision Training:**
   - FP16 for forward pass
   - FP32 for critical operations

### Memory Optimization

1. **Replay Buffer:** Use circular buffer
2. **Target Network:** Share feature extractor
3. **Gradient Accumulation:** For large batches
4. **Checkpoint Cleanup:** Remove old checkpoints

---

## References

### Papers

1. **DQN:** Mnih et al. "Human-level control through deep reinforcement learning" (2015)
2. **Double DQN:** van Hasselt et al. "Deep Reinforcement Learning with Double Q-learning" (2015)
3. **Dueling DQN:** Wang et al. "Dueling Network Architectures for Deep Reinforcement Learning" (2016)
4. **PPO:** Schulman et al. "Proximal Policy Optimization Algorithms" (2017)
5. **A3C:** Mnih et al. "Asynchronous Methods for Deep Reinforcement Learning" (2016)
6. **AlphaZero:** Silver et al. "Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm" (2017)

### Resources

- OpenAI Spinning Up: https://spinningup.openai.com
- Sutton & Barto: "Reinforcement Learning: An Introduction"
- DeepMind Research: https://deepmind.com/research

---

## Contributing

Want to add more algorithms or improve existing ones? Contributions welcome!

**Potential additions:**
- TD3 (Twin Delayed DDPG)
- SAC (Soft Actor-Critic)
- Rainbow DQN
- MuZero
- Offline RL algorithms

---

**Built with Elide - Seamless polyglot programming!** 🚀
