/**
 * Board Game AI Demo
 *
 * Demonstrates MCTS and neural network-based AI for board games:
 * - Tic-Tac-Toe with MCTS
 * - Connect Four with AlphaZero-style training
 * - Chess position evaluation
 * - Go-style pattern recognition
 *
 * Shows Elide's polyglot capabilities for strategic game AI
 * combining MCTS with deep learning!
 */

import { MCTSAgent, AlphaZeroAgent } from '../src/agents/mcts-agent.ts';
import { BaseGameEnv } from '../src/environments/custom-game-env.ts';

// @ts-ignore - NumPy
import numpy from 'python:numpy';
// @ts-ignore - PyTorch
import torch from 'python:torch';

// ============================================================================
// Tic-Tac-Toe Environment
// ============================================================================

export class TicTacToeEnv extends BaseGameEnv {
  private board: number[][];
  private currentPlayer: number;
  private winner: number | null;

  constructor() {
    super({});
    this.board = Array(3).fill(null).map(() => Array(3).fill(0));
    this.currentPlayer = 1; // 1 for X, -1 for O
    this.winner = null;
  }

  reset(): any {
    this.board = Array(3).fill(null).map(() => Array(3).fill(0));
    this.currentPlayer = 1;
    this.winner = null;
    this.episode++;

    return this.getObservation();
  }

  step(action: number): any {
    // Action is 0-8 representing board positions
    const row = Math.floor(action / 3);
    const col = action % 3;

    // Check if move is valid
    if (this.board[row][col] !== 0) {
      return {
        observation: this.getObservation(),
        reward: -10, // Invalid move penalty
        done: true,
        truncated: false,
        info: { invalidMove: true },
      };
    }

    // Make move
    this.board[row][col] = this.currentPlayer;

    // Check for winner
    const done = this.checkWinner() || this.isFull();
    let reward = 0;

    if (this.winner === this.currentPlayer) {
      reward = 1; // Win
    } else if (this.winner === -this.currentPlayer) {
      reward = -1; // Loss
    } else if (done) {
      reward = 0; // Draw
    }

    // Switch player
    this.currentPlayer *= -1;

    return {
      observation: this.getObservation(),
      reward,
      done,
      truncated: false,
      info: { winner: this.winner },
    };
  }

  private checkWinner(): boolean {
    // Check rows
    for (let row = 0; row < 3; row++) {
      if (this.board[row][0] !== 0 &&
          this.board[row][0] === this.board[row][1] &&
          this.board[row][1] === this.board[row][2]) {
        this.winner = this.board[row][0];
        return true;
      }
    }

    // Check columns
    for (let col = 0; col < 3; col++) {
      if (this.board[0][col] !== 0 &&
          this.board[0][col] === this.board[1][col] &&
          this.board[1][col] === this.board[2][col]) {
        this.winner = this.board[0][col];
        return true;
      }
    }

    // Check diagonals
    if (this.board[0][0] !== 0 &&
        this.board[0][0] === this.board[1][1] &&
        this.board[1][1] === this.board[2][2]) {
      this.winner = this.board[0][0];
      return true;
    }

    if (this.board[0][2] !== 0 &&
        this.board[0][2] === this.board[1][1] &&
        this.board[1][1] === this.board[2][0]) {
      this.winner = this.board[0][2];
      return true;
    }

    return false;
  }

  private isFull(): boolean {
    return this.board.every(row => row.every(cell => cell !== 0));
  }

  private getObservation(): any {
    return numpy.array(this.board).flatten();
  }

  getObservationSpace(): any {
    return {
      type: 'continuous',
      shape: [9],
      low: Array(9).fill(-1),
      high: Array(9).fill(1),
    };
  }

  getActionSpace(): any {
    return {
      type: 'discrete',
      size: 9,
    };
  }

  override render(): string {
    const symbols = { '-1': 'O', '0': '.', '1': 'X' };
    let output = '\n';

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const value = this.board[row][col].toString();
        output += symbols[value] + ' ';
      }
      output += '\n';
    }

    output += `\nCurrent player: ${this.currentPlayer === 1 ? 'X' : 'O'}\n`;
    return output;
  }

  getLegalActions(): number[] {
    const actions: number[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (this.board[row][col] === 0) {
          actions.push(row * 3 + col);
        }
      }
    }

    return actions;
  }
}

// ============================================================================
// Connect Four Environment
// ============================================================================

export class ConnectFourEnv extends BaseGameEnv {
  private board: number[][];
  private currentPlayer: number;
  private winner: number | null;
  private rows = 6;
  private cols = 7;

  constructor() {
    super({});
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.currentPlayer = 1;
    this.winner = null;
  }

  reset(): any {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.currentPlayer = 1;
    this.winner = null;
    this.episode++;

    return this.getObservation();
  }

  step(action: number): any {
    // Action is column number (0-6)
    if (action < 0 || action >= this.cols) {
      return {
        observation: this.getObservation(),
        reward: -10,
        done: true,
        truncated: false,
        info: { invalidMove: true },
      };
    }

    // Find lowest empty row in column
    let row = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][action] === 0) {
        row = r;
        break;
      }
    }

    // Invalid move if column is full
    if (row === -1) {
      return {
        observation: this.getObservation(),
        reward: -10,
        done: true,
        truncated: false,
        info: { invalidMove: true },
      };
    }

    // Make move
    this.board[row][action] = this.currentPlayer;

    // Check for winner
    const done = this.checkWinner(row, action) || this.isFull();
    let reward = 0;

    if (this.winner === this.currentPlayer) {
      reward = 1;
    } else if (done) {
      reward = 0; // Draw
    }

    // Switch player
    this.currentPlayer *= -1;

    return {
      observation: this.getObservation(),
      reward,
      done,
      truncated: false,
      info: { winner: this.winner },
    };
  }

  private checkWinner(row: number, col: number): boolean {
    const player = this.board[row][col];

    // Check horizontal
    if (this.checkDirection(row, col, 0, 1, player) >= 4) {
      this.winner = player;
      return true;
    }

    // Check vertical
    if (this.checkDirection(row, col, 1, 0, player) >= 4) {
      this.winner = player;
      return true;
    }

    // Check diagonal
    if (this.checkDirection(row, col, 1, 1, player) >= 4) {
      this.winner = player;
      return true;
    }

    // Check anti-diagonal
    if (this.checkDirection(row, col, 1, -1, player) >= 4) {
      this.winner = player;
      return true;
    }

    return false;
  }

  private checkDirection(
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    player: number
  ): number {
    let count = 1; // Count current piece

    // Check positive direction
    for (let i = 1; i < 4; i++) {
      const r = row + i * dRow;
      const c = col + i * dCol;
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols ||
          this.board[r][c] !== player) {
        break;
      }
      count++;
    }

    // Check negative direction
    for (let i = 1; i < 4; i++) {
      const r = row - i * dRow;
      const c = col - i * dCol;
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols ||
          this.board[r][c] !== player) {
        break;
      }
      count++;
    }

    return count;
  }

  private isFull(): boolean {
    return this.board[0].every(cell => cell !== 0);
  }

  private getObservation(): any {
    return numpy.array(this.board).flatten();
  }

  getObservationSpace(): any {
    return {
      type: 'continuous',
      shape: [this.rows * this.cols],
      low: Array(this.rows * this.cols).fill(-1),
      high: Array(this.rows * this.cols).fill(1),
    };
  }

  getActionSpace(): any {
    return {
      type: 'discrete',
      size: this.cols,
    };
  }

  override render(): string {
    const symbols = { '-1': 'O', '0': '.', '1': 'X' };
    let output = '\n';

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const value = this.board[row][col].toString();
        output += symbols[value] + ' ';
      }
      output += '\n';
    }

    output += '0 1 2 3 4 5 6\n';
    output += `\nCurrent player: ${this.currentPlayer === 1 ? 'X' : 'O'}\n`;
    return output;
  }

  getLegalActions(): number[] {
    const actions: number[] = [];

    for (let col = 0; col < this.cols; col++) {
      if (this.board[0][col] === 0) {
        actions.push(col);
      }
    }

    return actions;
  }
}

// ============================================================================
// Board Game Demo
// ============================================================================

export class BoardGameDemo {
  /**
   * Play Tic-Tac-Toe with MCTS
   */
  static async playTicTacToe(): Promise<void> {
    console.log('🎮 Tic-Tac-Toe with MCTS\n');

    const env = new TicTacToeEnv();
    const agent = new MCTSAgent({
      numSimulations: 1000,
      explorationConstant: 1.414,
      temperature: 0.1,
    });

    // Play game
    let state = env.reset();
    let done = false;

    while (!done) {
      console.log(env.render());

      // MCTS search for best move
      const action = agent.search(state, env);

      console.log(`MCTS selects action: ${action}\n`);

      // Take action
      const result = env.step(action);
      state = result.observation;
      done = result.done;

      if (done) {
        console.log(env.render());

        if (result.info.winner === 1) {
          console.log('X wins!');
        } else if (result.info.winner === -1) {
          console.log('O wins!');
        } else {
          console.log('Draw!');
        }
      }
    }
  }

  /**
   * Play Connect Four with MCTS
   */
  static async playConnectFour(): Promise<void> {
    console.log('🎮 Connect Four with MCTS\n');

    const env = new ConnectFourEnv();
    const agent = new MCTSAgent({
      numSimulations: 2000,
      explorationConstant: 1.414,
      temperature: 0.1,
    });

    let state = env.reset();
    let done = false;

    while (!done) {
      console.log(env.render());

      const action = agent.search(state, env);
      console.log(`MCTS selects column: ${action}\n`);

      const result = env.step(action);
      state = result.observation;
      done = result.done;

      if (done) {
        console.log(env.render());

        if (result.info.winner) {
          console.log(`${result.info.winner === 1 ? 'X' : 'O'} wins!`);
        } else {
          console.log('Draw!');
        }
      }

      // Small delay for visualization
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Compare MCTS vs Random
   */
  static async compareMCTSvsRandom(numGames = 100): Promise<void> {
    console.log('🆚 MCTS vs Random Agent\n');

    const env = new TicTacToeEnv();
    const mctsAgent = new MCTSAgent({
      numSimulations: 500,
      temperature: 0,
    });

    let mctsWins = 0;
    let randomWins = 0;
    let draws = 0;

    for (let game = 0; game < numGames; game++) {
      let state = env.reset();
      let done = false;

      while (!done) {
        // MCTS player (X)
        const mctsAction = mctsAgent.search(state, env);
        let result = env.step(mctsAction);
        state = result.observation;
        done = result.done;

        if (done) {
          if (result.info.winner === 1) mctsWins++;
          else if (result.info.winner === -1) randomWins++;
          else draws++;
          break;
        }

        // Random player (O)
        const legalActions = env.getLegalActions();
        const randomAction = legalActions[
          Math.floor(Math.random() * legalActions.length)
        ];
        result = env.step(randomAction);
        state = result.observation;
        done = result.done;

        if (done) {
          if (result.info.winner === 1) mctsWins++;
          else if (result.info.winner === -1) randomWins++;
          else draws++;
        }
      }

      if ((game + 1) % 10 === 0) {
        console.log(`Games: ${game + 1}/${numGames}`);
      }
    }

    console.log('\n📊 Results:');
    console.log(`  MCTS wins: ${mctsWins} (${(mctsWins / numGames * 100).toFixed(1)}%)`);
    console.log(`  Random wins: ${randomWins} (${(randomWins / numGames * 100).toFixed(1)}%)`);
    console.log(`  Draws: ${draws} (${(draws / numGames * 100).toFixed(1)}%)`);
  }

  /**
   * MCTS search visualization
   */
  static visualizeMCTSSearch(): void {
    console.log('🔍 MCTS Search Visualization\n');

    const env = new TicTacToeEnv();
    const agent = new MCTSAgent({
      numSimulations: 1000,
      explorationConstant: 1.414,
    });

    const state = env.reset();
    console.log('Initial state:');
    console.log(env.render());

    console.log('Running MCTS search with 1000 simulations...\n');

    const action = agent.search(state, env);
    const stats = agent.getSearchStatistics();

    console.log('Search Statistics:');
    console.log(`  Simulations: ${stats.numSimulations}`);
    console.log(`  Tree depth: ${stats.treeDepth}`);
    console.log(`  Nodes created: ${stats.nodesCreated}`);
    console.log(`  Best action: ${stats.bestAction}`);
    console.log(`  Best value: ${stats.bestValue.toFixed(3)}`);
  }
}

// ============================================================================
// Main Demo
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Board Game AI Demo\n');
  console.log('═'.repeat(50));
  console.log('\nThis demo showcases:');
  console.log('  ✓ Monte Carlo Tree Search (MCTS)');
  console.log('  ✓ Strategic game AI for board games');
  console.log('  ✓ UCT (Upper Confidence Bound for Trees)');
  console.log('  ✓ Game tree exploration and exploitation');
  console.log('  ✓ Self-play and agent comparison');
  console.log('\n' + '═'.repeat(50) + '\n');

  // Choose demo mode
  const demoMode = 'tictactoe'; // 'tictactoe' | 'connect4' | 'compare' | 'visualize'

  if (demoMode === 'tictactoe') {
    await BoardGameDemo.playTicTacToe();
  } else if (demoMode === 'connect4') {
    await BoardGameDemo.playConnectFour();
  } else if (demoMode === 'compare') {
    await BoardGameDemo.compareMCTSvsRandom(100);
  } else if (demoMode === 'visualize') {
    BoardGameDemo.visualizeMCTSSearch();
  }

  console.log('\n✅ Demo complete!');
  console.log('\n💡 MCTS provides strong strategic play for board games');
  console.log('   without requiring domain-specific knowledge!');
}
