# Cosmic Match-3 Game - Complete Implementation

## Project Overview
A fully functional web-based Match-3 puzzle game featuring alien characters with 10-round progression, shop system, and strategic upgrades. Built with Phaser.js and TypeScript, the game includes a complete scoring system, increasing difficulty per round, cascading matches, and polished animations.

Repo: https://github.com/natethegreat418/cosmic-matcher
Live project: https://cosmic-matcher.netlify.app/

## Tech Stack
- **Frontend**: Phaser.js (game framework) with SVG sprites
- **Language**: TypeScript with strict mode
- **Build Tool**: Vite
- **Target**: Web browser with responsive design (desktop 900x700, mobile optimized)

## Commands
### Development
- `npm run dev` - Start the Vite development server with hot module replacement
- `npm run build` - Type-check with TypeScript and build for production
- `npm run preview` - Preview the production build locally

### Testing
- `npm test` - Run tests in watch mode (for development)
- `npm run test:ui` - Open visual test UI in browser
- `npm run test:run` - Run all tests once (for CI/verification)

## Project Structure
```
src/
  ├── main.ts                        # Entry point and Phaser config
  ├── scenes/
  │   ├── GameScene.ts               # Main game scene with round indicators
  │   ├── RoundTransitionScene.ts    # Between-round summary & shop access
  │   ├── ShopScene.ts               # Cosmic shop for upgrades
  │   └── GameOverScene.ts           # Final game summary after 10 rounds
  ├── game/
  │   ├── Grid.ts                    # Grid management with swap validation
  │   ├── Tile.ts                    # Individual tile logic with animations
  │   ├── MatchDetector.ts           # Match detection logic (3+ tiles)
  │   ├── GameState.ts               # Round state with timer & scoring
  │   ├── GameProgressManager.ts     # Multi-round progression & speed scaling
  │   ├── ShopSystem.ts              # Shop inventory & purchase logic
  │   ├── UpgradeManager.ts          # Upgrade effects & calculations
  │   └── InputManager.ts            # Input state & visual feedback
  ├── types/
  │   ├── index.ts                   # Core type definitions (tiles, config)
  │   └── Progress.ts                # Progress & shop type definitions
  ├── test/
  │   ├── setup.ts                   # Vitest configuration & mocks
  │   └── helpers/
  │       └── TileFactory.ts         # Test utilities for creating mock tiles
  └── assets/
      ├── aliens/                    # SVG alien sprites (6 types)
      ├── ships/                     # SVG ship icons for round indicators
      └── shop/                      # Shop item icons
```

## Game Rules & Mechanics

### Objective
Complete 10 rounds of increasingly difficult gameplay, managing your score strategically to purchase upgrades between rounds. Each round lasts 60 seconds (display time), but the actual speed increases dramatically.

### Core Gameplay
1. **Grid**: 8x8 grid of alien characters
2. **Matching**: Click adjacent tiles to swap them
3. **Valid Swaps**: Only swaps that create matches of 3+ are allowed
4. **Cascading**: When matches are removed, tiles drop down and new ones appear from the top
5. **Combos**: Cascading matches multiply your score and award bonus time

### Round Progression System
- **10 Rounds Total**: Complete all 10 rounds to finish the game
- **Increasing Difficulty**: Each round pair increases timer speed
  - Rounds 1-2: 1x speed (normal)
  - Rounds 3-4: 1.5x speed
  - Rounds 5-6: 2x speed
  - Rounds 7-8: 2.5x speed
  - Rounds 9-10: 3x speed (ludicrous!)
- **Strategic Scoring**: Score is used for shop purchases, creating a risk/reward balance

### Alien Characters
- **Deep Space Blue** - Tech Engineer with backpack and visor
- **Nebula Purple** - Mystic with crystal crown and flowing scarves
- **Cosmic Teal** - Explorer with helmet and utility belt
- **Solar Gold** - Commander with insignia and shoulder pads
- **Meteor Silver** - Mechanic with goggles and wrench
- **Plasma Pink** - Energy Being with glowing rays

### Scoring System
- **Base Score**: 10 points per tile matched
- **Long Match Bonus**: +50 points for each tile beyond 3 in a match
- **Cascade Multiplier**: 1.5x compound multiplier for each cascade level (2.25x for cascade 3, 3.38x for cascade 4, etc.)
- **Combo Rewards**: 5+ cascades award +2 seconds of bonus time per level above threshold

### Shop System (Cosmic Shop)
Players can spend their score between rounds on upgrades:

**Consumable Upgrades:**
- **Radiation Shield** (150 points, stackable up to 5x): +10 seconds to next round timer
- **Quantum Time Dilation** (500 points, stackable up to 5x): Slows countdown by 0.5s per tick for one round

**Permanent Upgrades:**
- **Phase Gun** (3200 points, one-time): Enables diagonal 3-tile matches
- **Tractor Beam** (1800 points, one-time): Swap tiles from 2 spaces away

**Strategic Tradeoff**: Spending score reduces your total score, so players must balance short-term power vs. long-term score goals.

### Visual Features
- **Responsive Design**: Optimized layouts for both desktop (900x700) and mobile devices
- **Round Indicators**: Ship icons that evolve based on current speed (normal → medium → fast → ludicrous)
- **Timer Display**: 60-second countdown with color-coded urgency
  - Cyan: 30+ seconds
  - Gold: 10-30 seconds
  - Pink: <10 seconds (with pulse animation)
- **Visual Feedback**:
  - Cyan border for selected tiles
  - White border for valid swap hints
  - Smooth animations for all actions
  - Score increase animations with pulse effects
- **Scene Transitions**: Smooth transitions between rounds, shop, and game over screens

## Technical Implementation

### Architecture Overview
The game follows a **multi-scene architecture** with **singleton pattern** for global state management:
- **Scene Management**: Phaser scenes handle game flow (GameScene → RoundTransitionScene → ShopScene → repeat)
- **State Management**: Singleton managers (GameProgressManager, ShopSystem, UpgradeManager) persist across scenes
- **Separation of Concerns**: Game logic separated from rendering, with clear interfaces between systems

### Key Classes

#### Core Game Classes

**Tile Class**
```typescript
export class Tile {
  public sprite: Phaser.GameObjects.Image;
  public backgroundRect: Phaser.GameObjects.Rectangle;
  public color: TileColor;

  // Animation methods (Promise-based for sequencing)
  animateToPosition(gridX: number, gridY: number): Promise<void>;
  animateRemoval(): Promise<void>;
  animateDropIn(fromY: number): Promise<void>;

  // Visual states
  setSelected(): void;  // Cyan highlight
  setHint(): void;      // White highlight
  unhighlight(): void;  // Normal state
}
```

**Grid Class**
```typescript
export class Grid {
  public tiles: (Tile | null)[][];

  // Core functionality
  private async handleTileClick(tile: Tile): Promise<void>;
  private async attemptSwap(pos1: TilePosition, pos2: TilePosition): Promise<void>;
  private async processMatches(): Promise<void>;

  // Match-3 mechanics with cascading
  private async removeMatches(matches: TilePosition[][]): Promise<void>;
  private async dropTiles(): Promise<void>;
  private async fillEmptySpaces(): Promise<void>;

  // Lifecycle
  public hideGrid(): void;
  public destroy(): void;
}
```

**GameState Class** (Per-Round State)
```typescript
export class GameState {
  // Round-specific state
  private timeRemaining: number;      // Display time (starts at 60)
  private actualTimeElapsed: number;  // Real time for speed calculation
  private score: number;
  private currentCombo: number;
  private speedMultiplier: number;    // From GameProgressManager

  // Scoring with upgrade support
  public addMatchScore(matchGroups: any[][], cascadeNumber: number): void;
  private addBonusTime(seconds: number): void;

  // UI management with responsive positioning
  private updateTimerDisplay(): void;
  private animateScoreIncrease(from: number, to: number): void;

  // Lifecycle
  public setGameOverCallback(callback: () => void): void;
  public getScore(): number;
  public getTotalCombos(): number;
}
```

**MatchDetector Class** (Static utility)
```typescript
export class MatchDetector {
  static findMatches(tiles: (Tile | null)[][]): TilePosition[][];
  static wouldSwapCreateMatch(tiles, pos1, pos2): boolean;
  static areAdjacent(pos1: TilePosition, pos2: TilePosition): boolean;
}
```

#### Progression & Shop System (Singletons)

**GameProgressManager** (Global Game State)
```typescript
export class GameProgressManager {
  private progress: GameProgress;  // Persists across rounds

  // Round management
  public completeRound(roundScore: number): RoundResult;
  public getCurrentRound(): number;
  public getRoundTimer(): number;  // Always 60 seconds
  public getTimerSpeedMultiplier(): number;  // 1x to 3x based on round

  // Score & points management
  public getTotalScore(): number;
  public getAvailablePoints(): number;
  public spendPoints(cost: number): boolean;  // Returns success
  public canAfford(cost: number): boolean;

  // Upgrade tracking
  public addUpgrade(upgradeId: string): void;
  public getOwnedUpgrades(): string[];

  // Game completion
  public isGameComplete(): boolean;
  public startNewGame(): void;
}
```

**ShopSystem** (Shop Inventory & Purchases)
```typescript
export class ShopSystem {
  private items: ShopItem[];

  // Shop interface
  public getAvailableItems(): ShopItem[];
  public getAllItems(): ShopItem[];
  public purchaseItem(itemId: string): PurchaseResult;
  public getItemCost(itemId: string): number;  // Scales with purchase count

  // Upgrade lifecycle
  public consumeTimeUpgrades(): void;  // Called after applying to round
  public resetPurchases(): void;       // Called on new game
}
```

**UpgradeManager** (Upgrade Effects)
```typescript
export class UpgradeManager {
  // Apply upgrade effects to game mechanics
  public applyTimeBonus(baseTime: number): number;
  public getTimerSlowdown(): number;  // From time dilation

  // Query upgrade state
  public hasUpgrade(upgradeId: string): boolean;
  public getUpgradeCount(upgradeId: string): number;
}
```

#### Scene Classes

**GameScene** - Main gameplay with round indicator and speed warnings
**RoundTransitionScene** - Round summary with stats and shop button
**ShopScene** - Shop UI with purchase logic and item display
**GameOverScene** - Final summary after 10 rounds complete

### Configuration

**Responsive Configuration System**
```typescript
// Dynamic configuration based on device
const getTileConfig = () => {
  if (isMobile()) {
    // Calculates optimal tile size for mobile screens
    // Caps at 50px to prevent oversized tiles
    return { tileSize: calculated, offsetX: 10, offsetY: 80 };
  }
  // Desktop: Centers grid in 900px canvas
  return { tileSize: 60, offsetX: 196, offsetY: 120 };
};

export const GAME_CONFIG = {
  GRID_WIDTH: 8,
  GRID_HEIGHT: 8,
  TILE_SIZE: dynamic,            // 60px desktop, ≤50px mobile
  TILE_SPACING: 4,
  COLORS: [6 alien types] as const,
  ANIMATION_DURATION: 300,
  BOARD_OFFSET_X: dynamic,       // Centers grid on viewport
  BOARD_OFFSET_Y: dynamic,
  IS_MOBILE: boolean             // Device detection flag
};
```

**Type Definitions**
```typescript
// Progress tracking
export interface GameProgress {
  currentRound: number;        // 1-10
  totalScore: number;          // Sum of all rounds
  roundScores: number[];       // Individual round scores
  availablePoints: number;     // Score available for shop
  spentPoints: number;         // Total spent in shop
  ownedUpgrades: string[];     // Purchased upgrade IDs
  isComplete: boolean;         // All 10 rounds finished
}

// Shop items
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;                // Base cost (scales with purchases)
  maxPurchases: number;        // Purchase limit
  purchaseCount: number;       // Times purchased
  icon?: string;
}
```

## Development Guidelines

### Architecture Patterns
- **Singleton Pattern**: GameProgressManager, ShopSystem, UpgradeManager persist across scenes
  - Ensures single source of truth for game state
  - `getInstance()` pattern with private constructors
  - `resetInstance()` methods for testing
- **Scene-Based Flow**: Phaser's built-in scene management for game flow
  - Data passing via `scene.start(sceneName, data)`
  - Scene lifecycle (preload → create → update → shutdown)
- **Separation of Concerns**:
  - Game logic separated from Phaser rendering
  - Managers handle state, scenes handle presentation
  - Grid handles tile interactions, GameState handles scoring/timer
- **Promise-Based Animations**: All animations return promises for proper sequencing
  - Enables complex cascading match sequences
  - Prevents race conditions during tile swaps
- **Type Safety**: Full TypeScript coverage with strict mode

### Game Flow Architecture
```
Game Start
    ↓
GameScene (Round 1-10)
    ├── GameState (timer, score, UI)
    ├── Grid (tile interactions)
    └── MatchDetector (logic)
    ↓
RoundTransitionScene
    ├── Display round stats
    └── Shop button
    ↓
ShopScene (optional)
    ├── ShopSystem (inventory)
    ├── UpgradeManager (effects)
    └── GameProgressManager (points)
    ↓
[Repeat or Game Over]
    ↓
GameOverScene (after Round 10)
    └── Final statistics
```

### Code Quality Standards
- **JSDoc Comments**: Comprehensive documentation for all public methods
- **Meaningful Names**: Clear, descriptive variable and method names
- **Error Handling**: Graceful handling of edge cases (invalid swaps, no matches, etc.)
- **No Initial Matches**: Grid generation ensures playable starting state
- **Responsive Design**: Mobile and desktop layouts calculated dynamically
- **Type Safety**: Strong TypeScript types with strict mode enabled (no `any` types in core logic)
- **Unit Testing**: Comprehensive test coverage for game logic using Vitest

### Development Workflow (MANDATORY)

**After making ANY code changes, ALWAYS execute these steps in order:**

1. **Type Checking** - Verify TypeScript types are correct
   ```bash
   npm run build
   ```
   - Must complete without errors
   - Fix any type errors before proceeding

2. **Add/Update Tests** - Ensure test coverage for new/modified code
   - Add unit tests for new functions/classes
   - Update existing tests if behavior changed
   - Focus on:
     - Core game logic (MatchDetector, GameState, etc.)
     - Business logic (ShopSystem, UpgradeManager, GameProgressManager)
     - Edge cases and error conditions
   - Test files should be named `*.test.ts` and placed alongside the code they test

3. **Run All Tests** - Verify nothing broke
   ```bash
   npm run test:run
   ```
   - All tests must pass
   - Fix any failing tests before committing
   - If a test fails, either fix the code or update the test (if behavior intentionally changed)

**This workflow is NON-NEGOTIABLE and must be followed for every code change, no matter how small.**

### Testing Strategy
- **Unit Tests**: Focus on pure logic without Phaser dependencies
  - MatchDetector (match detection, swap validation)
  - GameProgressManager (round progression, scoring)
  - ShopSystem (purchases, cost calculations)
  - UpgradeManager (effect calculations)
- **Test Helpers**: Use `TileFactory` for creating mock game state
- **Mocking**: Tile class is mocked to avoid Phaser dependencies in tests
- **Coverage Goals**: All game logic should have unit tests

### Visual Polish
- **Smooth Animations**:
  - Tile movements, removals, and drop-ins
  - Score counter animations with easing
  - Pulse effects for urgency (timer, combos)
- **Color-Coded UI**:
  - Timer changes color based on remaining time (cyan → gold → pink)
  - Consistent alien color palette across UI
- **Visual Feedback**:
  - Selected tiles (cyan border)
  - Valid swap hints (white border)
  - Combo text animations
  - Bonus time pop-ups
- **Responsive Layout**:
  - Desktop: UI positioned right of grid
  - Mobile: UI positioned below grid
  - Dynamic font sizes and spacing

### Performance & Best Practices
- **Efficient Match Detection**: O(n) grid scanning for matches
- **Batched Animations**: Multiple tiles animate simultaneously using Phaser tweens
- **Memory Management**:
  - Proper cleanup of game objects in `destroy()` methods
  - Scene shutdown handlers for state cleanup
  - Tween completion callbacks for object destruction
- **State Management**:
  - Singleton managers prevent duplicate state
  - Scene data passing for context preservation
  - Clear separation between round state (GameState) and global state (GameProgressManager)