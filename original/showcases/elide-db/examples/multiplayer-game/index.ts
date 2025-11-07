/**
 * Multiplayer Game Example - Tic-Tac-Toe
 * Demonstrates real-time state sync for multiplayer games
 */

import { ElideDB } from '../../client/client-api';
import { Document, TableSchema } from '../../types';

// Player document interface
interface PlayerDocument extends Document {
  name: string;
  avatar: string;
  wins: number;
  losses: number;
  draws: number;
  online: boolean;
  lastSeen: number;
}

// Game document interface
interface GameDocument extends Document {
  player1: string;
  player2: string;
  board: string[]; // 9 cells: 'X', 'O', or ''
  currentTurn: string; // player ID
  status: 'waiting' | 'playing' | 'finished';
  winner?: string;
  startedAt: number;
  finishedAt?: number;
}

// Move document interface
interface MoveDocument extends Document {
  gameId: string;
  playerId: string;
  position: number; // 0-8
  symbol: 'X' | 'O';
  timestamp: number;
}

/**
 * Multiplayer Tic-Tac-Toe Game
 */
class MultiplayerTicTacToe {
  private db: ElideDB;
  private playerId: string;
  private playerName: string;

  constructor(playerName: string, syncUrl?: string) {
    this.playerName = playerName;
    this.playerId = '';

    this.db = new ElideDB({
      name: 'multiplayer-game',
      syncUrl,
      syncInterval: 1000, // Fast sync for real-time gameplay
    });
  }

  /**
   * Initialize the game
   */
  async init(): Promise<void> {
    const schemas: TableSchema[] = [
      {
        name: 'players',
        fields: [
          { name: 'name', type: 'string', required: true },
          { name: 'avatar', type: 'string', required: true },
          { name: 'wins', type: 'number', required: true },
          { name: 'losses', type: 'number', required: true },
          { name: 'draws', type: 'number', required: true },
          { name: 'online', type: 'boolean', required: true },
          { name: 'lastSeen', type: 'number', required: true }
        ]
      },
      {
        name: 'games',
        fields: [
          { name: 'player1', type: 'string', required: true },
          { name: 'player2', type: 'string', required: true },
          { name: 'board', type: 'json', required: true },
          { name: 'currentTurn', type: 'string', required: true },
          { name: 'status', type: 'string', required: true },
          { name: 'winner', type: 'string' },
          { name: 'startedAt', type: 'number', required: true },
          { name: 'finishedAt', type: 'number' }
        ]
      },
      {
        name: 'moves',
        fields: [
          { name: 'gameId', type: 'string', required: true },
          { name: 'playerId', type: 'string', required: true },
          { name: 'position', type: 'number', required: true },
          { name: 'symbol', type: 'string', required: true },
          { name: 'timestamp', type: 'number', required: true }
        ]
      }
    ];

    await this.db.init(schemas);

    // Create or get player
    await this.createPlayer();

    console.log(`🎮 Player "${this.playerName}" joined the game!`);
  }

  /**
   * Create player profile
   */
  private async createPlayer(): Promise<void> {
    const avatars = ['👤', '🦸', '🤖', '👾', '🧙', '🦹', '🧚', '🧛'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const player = await this.db.insert<PlayerDocument>('players', {
      name: this.playerName,
      avatar: randomAvatar,
      wins: 0,
      losses: 0,
      draws: 0,
      online: true,
      lastSeen: Date.now()
    });

    this.playerId = player.id;
  }

  /**
   * Create a new game
   */
  async createGame(): Promise<GameDocument> {
    const game = await this.db.insert<GameDocument>('games', {
      player1: this.playerId,
      player2: '',
      board: Array(9).fill(''),
      currentTurn: this.playerId,
      status: 'waiting',
      startedAt: Date.now()
    });

    console.log(`🎯 Game created! Waiting for opponent...`);
    return game;
  }

  /**
   * Join an existing game
   */
  async joinGame(gameId: string): Promise<GameDocument> {
    const game = await this.db.get<GameDocument>('games', gameId);
    if (!game) throw new Error('Game not found');

    if (game.status !== 'waiting') {
      throw new Error('Game is not available');
    }

    if (game.player1 === this.playerId) {
      throw new Error('Cannot join your own game');
    }

    const updated = await this.db.update<GameDocument>('games', gameId, {
      player2: this.playerId,
      status: 'playing'
    });

    console.log(`🤝 Joined game ${gameId}!`);
    return updated;
  }

  /**
   * Make a move
   */
  async makeMove(gameId: string, position: number): Promise<void> {
    const game = await this.db.get<GameDocument>('games', gameId);
    if (!game) throw new Error('Game not found');

    // Validate move
    if (game.status !== 'playing') {
      throw new Error('Game is not in progress');
    }

    if (game.currentTurn !== this.playerId) {
      throw new Error('Not your turn');
    }

    if (position < 0 || position > 8) {
      throw new Error('Invalid position');
    }

    if (game.board[position] !== '') {
      throw new Error('Position already taken');
    }

    // Determine symbol
    const symbol: 'X' | 'O' = game.player1 === this.playerId ? 'X' : 'O';

    // Update board
    const newBoard = [...game.board];
    newBoard[position] = symbol;

    // Record move
    await this.db.insert<MoveDocument>('moves', {
      gameId,
      playerId: this.playerId,
      position,
      symbol,
      timestamp: Date.now()
    });

    // Check for winner
    const winner = this.checkWinner(newBoard);
    const isDraw = !winner && newBoard.every(cell => cell !== '');

    if (winner || isDraw) {
      // Game finished
      await this.db.update('games', gameId, {
        board: newBoard,
        status: 'finished',
        winner: winner ? this.playerId : undefined,
        finishedAt: Date.now()
      });

      // Update player stats
      if (winner) {
        await this.updateStats('win');
        const opponent = game.player1 === this.playerId ? game.player2 : game.player1;
        await this.updatePlayerStats(opponent, 'loss');
        console.log(`🎉 You won!`);
      } else {
        await this.updateStats('draw');
        const opponent = game.player1 === this.playerId ? game.player2 : game.player1;
        await this.updatePlayerStats(opponent, 'draw');
        console.log(`🤝 Draw!`);
      }
    } else {
      // Next turn
      const nextPlayer = game.currentTurn === game.player1 ? game.player2 : game.player1;
      await this.db.update('games', gameId, {
        board: newBoard,
        currentTurn: nextPlayer
      });

      console.log(`✅ Move made at position ${position}`);
    }
  }

  /**
   * Check for winner
   */
  private checkWinner(board: string[]): boolean {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]              // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update player stats
   */
  private async updateStats(result: 'win' | 'loss' | 'draw'): Promise<void> {
    const player = await this.db.get<PlayerDocument>('players', this.playerId);
    if (!player) return;

    const updates: Partial<PlayerDocument> = {
      lastSeen: Date.now()
    };

    if (result === 'win') updates.wins = player.wins + 1;
    else if (result === 'loss') updates.losses = player.losses + 1;
    else updates.draws = player.draws + 1;

    await this.db.update('players', this.playerId, updates);
  }

  /**
   * Update another player's stats
   */
  private async updatePlayerStats(playerId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    const player = await this.db.get<PlayerDocument>('players', playerId);
    if (!player) return;

    const updates: Partial<PlayerDocument> = {
      lastSeen: Date.now()
    };

    if (result === 'win') updates.wins = player.wins + 1;
    else if (result === 'loss') updates.losses = player.losses + 1;
    else updates.draws = player.draws + 1;

    await this.db.update('players', playerId, updates);
  }

  /**
   * Get available games
   */
  async getAvailableGames(): Promise<GameDocument[]> {
    return this.db.table<GameDocument>('games')
      .where('status', 'waiting')
      .orderByDesc('startedAt')
      .get();
  }

  /**
   * Get active games for current player
   */
  async getMyGames(): Promise<GameDocument[]> {
    const allGames = await this.db.table<GameDocument>('games')
      .where('status', 'playing')
      .get();

    return allGames.filter(
      game => game.player1 === this.playerId || game.player2 === this.playerId
    );
  }

  /**
   * Get game by ID
   */
  async getGame(gameId: string): Promise<GameDocument | null> {
    return this.db.get<GameDocument>('games', gameId);
  }

  /**
   * Get game moves
   */
  async getGameMoves(gameId: string): Promise<MoveDocument[]> {
    const allMoves = await this.db.table<MoveDocument>('moves')
      .where('gameId', gameId)
      .orderByAsc('timestamp')
      .get();

    return allMoves;
  }

  /**
   * Subscribe to game updates
   */
  subscribeToGame(gameId: string, callback: (game: GameDocument | null) => void) {
    let currentGame: GameDocument | null = null;

    const subscription = this.db.table<GameDocument>('games')
      .subscribe(async (games) => {
        const game = games.find(g => g.id === gameId) || null;

        // Only call callback if game state changed
        if (JSON.stringify(game) !== JSON.stringify(currentGame)) {
          currentGame = game;
          callback(game);
        }
      });

    // Also send initial state
    this.getGame(gameId).then(callback);

    return subscription;
  }

  /**
   * Get online players
   */
  async getOnlinePlayers(): Promise<PlayerDocument[]> {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const allPlayers = await this.db.table<PlayerDocument>('players')
      .orderByDesc('lastSeen')
      .get();

    return allPlayers.filter(p => p.lastSeen > fiveMinutesAgo);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(): Promise<PlayerDocument[]> {
    const players = await this.db.table<PlayerDocument>('players').all();

    return players.sort((a, b) => {
      const aScore = a.wins * 3 + a.draws;
      const bScore = b.wins * 3 + b.draws;
      return bScore - aScore;
    });
  }

  /**
   * Display board
   */
  displayBoard(board: string[]): void {
    console.log('\n  Board:');
    console.log('  ┌───┬───┬───┐');
    for (let i = 0; i < 3; i++) {
      const row = [
        board[i * 3] || ' ',
        board[i * 3 + 1] || ' ',
        board[i * 3 + 2] || ' '
      ];
      console.log(`  │ ${row[0]} │ ${row[1]} │ ${row[2]} │`);
      if (i < 2) console.log('  ├───┼───┼───┤');
    }
    console.log('  └───┴───┴───┘\n');
  }

  /**
   * Set player offline
   */
  async setOffline(): Promise<void> {
    await this.db.update('players', this.playerId, {
      online: false,
      lastSeen: Date.now()
    });
  }

  /**
   * Close the game
   */
  async close(): Promise<void> {
    await this.setOffline();
    await this.db.close();
  }
}

/**
 * Demo usage
 */
async function demo() {
  console.log('=== Multiplayer Tic-Tac-Toe Demo ===\n');

  // Create two players
  const player1 = new MultiplayerTicTacToe('Alice', 'ws://localhost:3000');
  const player2 = new MultiplayerTicTacToe('Bob', 'ws://localhost:3000');

  await player1.init();
  await player2.init();

  console.log('\n--- Alice creates a game ---');
  const game = await player1.createGame();

  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n--- Bob joins the game ---');
  await player2.joinGame(game.id);

  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n--- Subscribe to game updates ---');
  const subscription = player2.subscribeToGame(game.id, (game) => {
    if (game) {
      console.log(`[Real-time] Game status: ${game.status}`);
      player2.displayBoard(game.board);
    }
  });

  console.log('\n--- Playing the game ---');

  // Alice's turn (X)
  console.log("Alice's turn:");
  await player1.makeMove(game.id, 4); // Center
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Bob's turn (O)
  console.log("Bob's turn:");
  await player2.makeMove(game.id, 0); // Top-left
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Alice's turn
  console.log("Alice's turn:");
  await player1.makeMove(game.id, 1); // Top-center
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Bob's turn
  console.log("Bob's turn:");
  await player2.makeMove(game.id, 8); // Bottom-right
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Alice's turn
  console.log("Alice's turn:");
  await player1.makeMove(game.id, 7); // Bottom-center
  await new Promise(resolve => setTimeout(resolve, 2000));

  subscription.unsubscribe();

  console.log('\n--- View leaderboard ---');
  const leaderboard = await player1.getLeaderboard();
  console.log('Leaderboard:');
  leaderboard.slice(0, 5).forEach((player, index) => {
    console.log(`  ${index + 1}. ${player.avatar} ${player.name} - ${player.wins}W ${player.losses}L ${player.draws}D`);
  });

  console.log('\n--- Cleanup ---');
  await player1.close();
  await player2.close();

  console.log('\nDemo completed!');
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { MultiplayerTicTacToe, PlayerDocument, GameDocument, MoveDocument };
