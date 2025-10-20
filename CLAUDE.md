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
  │   ├── GameOverScene.ts           # Final game summary after 10 rounds
  │   ├── NameEntryScene.ts          # Player name entry for leaderboard
  │   └── LeaderboardScene.ts        # High score leaderboard display
  ├── game/
  │   ├── Grid.ts                    # Grid management with swap validation & match config
  │   ├── Tile.ts                    # Individual tile logic with animations
  │   ├── TilePool.ts                # Object pooling for tile performance
  │   ├── MatchDetector.ts           # Match detection logic (config-driven, no singleton deps)
  │   ├── GameState.ts               # Round state with timer & scoring
  │   ├── GameProgressManager.ts     # Multi-round progression & speed scaling
  │   ├── ShopSystem.ts              # Shop inventory & purchase logic
  │   ├── UpgradeManager.ts          # Upgrade effects & calculations
  │   ├── InputManager.ts            # Input state & visual feedback
  │   └── DevSceneNavigator.ts       # Dev-only scene navigation & debugging tools
  ├── config/
  │   ├── GameConfig.ts              # Centralized game balance (scoring, shop, upgrades, timers)
  │   ├── DevConfig.ts               # Dev-only configuration (dev mode detection)
  │   ├── ResponsiveConfig.ts        # Responsive layout configuration
  │   └── DesignSystem.ts            # UI styling constants
  ├── services/
  │   ├── LocalStorageManager.ts     # Game save/load functionality
  │   ├── SupabaseClient.ts          # Supabase connection
  │   └── LeaderboardService.ts      # Leaderboard API integration
  ├── types/
  │   ├── index.ts                   # Core type definitions (tiles, config, MatchConfig)
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

### Critical UI Notes
- **Mobile Bottom Safe Area**: RoundTransitionScene and ShopScene use sticky bottom shelves with an 80px `bottomSafeArea` constant to prevent Safari mobile UI from covering buttons. This value must be maintained when making layout changes to these scenes.

## Technical Implementation

### Architecture Overview
The game follows a **multi-scene architecture** with **centralized configuration** and **dependency injection patterns**:
- **Scene Management**: Phaser scenes handle game flow (GameScene → RoundTransitionScene → ShopScene → repeat)
- **State Management**: Singleton managers (GameProgressManager, ShopSystem, UpgradeManager) persist across scenes
- **Centralized Configuration**: All game balance values in `/src/config/GameConfig.ts` (scoring, shop costs, upgrade effects, timers)
- **Dependency Injection**: Core logic classes (MatchDetector) receive configuration rather than querying singletons at runtime
- **Separation of Concerns**: Game logic separated from rendering, with clear interfaces between systems
- **Test-Driven Design**: 116+ unit tests covering game logic, shop systems, and configuration helpers

### Key Classes

**Grid** - Creates `MatchConfig` from UpgradeManager and passes to MatchDetector. Handles tile interactions, swap validation, match processing, and cascading.

**MatchDetector** (Static utility) - Pure functional logic for match detection. All methods accept `MatchConfig` parameter. No singleton dependencies.
```typescript
static findMatches(tiles: (Tile | null)[][], config: MatchConfig): MatchGroup[];
static wouldSwapCreateMatch(tiles, pos1, pos2, config: MatchConfig): boolean;
static areAdjacent(pos1, pos2, config: MatchConfig): boolean;
```

**GameProgressManager** (Singleton) - Manages multi-round progression, score/points, upgrade tracking, and speed multipliers (1x to 3x).

**ShopSystem** (Singleton) - Shop inventory and purchase logic. Uses `GameConfigHelpers.calculateItemCost()` for dynamic pricing.

**UpgradeManager** (Singleton) - Tracks owned upgrades and calculates their effects (time bonuses, slowdown).

**GameState** - Per-round state (timer, score, combos). Uses centralized `SCORING` config for calculations.

**Scenes**: GameScene, RoundTransitionScene, ShopScene, GameOverScene, NameEntryScene, LeaderboardScene

### Configuration

**Centralized Game Balance Configuration (src/config/GameConfig.ts)**

All game balance values, costs, and mechanics are centralized in a single configuration file for easy tuning:

```typescript
// Scoring rules
export const SCORING = {
  BASE_TILE_SCORE: 10,
  COMBO_MULTIPLIER: 1.5,
  LONG_MATCH_BONUS: 50,
  TIME_BONUS_THRESHOLD: 5,
  COMBO_BONUS_TIME_SECONDS: 2,
};

// Shop items with base costs
export const SHOP_ITEMS = {
  bonus_time: {
    id: 'bonus_time',
    name: 'Radiation Shield',
    baseCost: 150,
    maxPurchases: 5,
    // ...
  },
  // ... other items
};

// Upgrade effect values
export const UPGRADE_EFFECTS = {
  BONUS_TIME_SECONDS: 10,
  TIME_DILATION_SLOWDOWN: 0.5,
  TRACTOR_BEAM_DISTANCE: 2,
  DEFAULT_SWAP_DISTANCE: 1,
};

// Timer configuration
export const TIMER_CONFIG = {
  PRODUCTION_ROUND_TIMER: 60,
  DEV_ROUND_TIMER: 15,
  SPEED_MULTIPLIERS: {
    rounds_1_2: 1.0,
    rounds_3_4: 1.5,
    rounds_5_6: 2.0,
    rounds_7_8: 2.5,
    rounds_9_10: 3.0,
  },
  COLOR_THRESHOLDS: {
    DANGER: 10,
    WARNING: 30,
  },
};

// Helper functions for calculations
export const GameConfigHelpers = {
  getSpeedMultiplier(round: number): number;
  calculateItemCost(itemId, purchaseCount): number;
  getBaseRoundTimer(isDev): number;
  getTimerColor(secondsRemaining): string;
};
```

**Benefits:**
- Single source of truth for all game balance
- Easy to tune values without hunting through code
- Configuration can be tested independently
- Shop costs and upgrade effects clearly documented
- Helper functions encapsulate calculation logic

**Type Definitions**: See `/src/types/index.ts` for `MatchConfig`, `GameProgress`, `ShopItem`, and other interfaces.

## Development Guidelines

### Architecture Patterns
- **Centralized Configuration**: All game balance values in `/src/config/GameConfig.ts`
  - Single source of truth for scoring, shop costs, upgrade effects, timers
  - Easy to modify game balance without hunting through code
  - Configuration values are testable independently
  - Helper functions encapsulate calculation logic

- **Dependency Injection**: Core logic receives config instead of querying singletons
  - `MatchDetector` receives `MatchConfig` parameter (no UpgradeManager dependency)
  - `Grid` creates config once and passes to MatchDetector
  - Makes logic pure and testable without mocking
  - Improves performance by eliminating runtime singleton lookups

- **Singleton Pattern**: State managers persist across scenes
  - GameProgressManager, ShopSystem, UpgradeManager
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
  - Configuration separated from implementation

- **Promise-Based Animations**: All animations return promises for proper sequencing
  - Enables complex cascading match sequences
  - Prevents race conditions during tile swaps

- **Type Safety**: Full TypeScript coverage with strict mode
  - 116+ unit tests covering all game logic
  - No `any` types in core logic

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

### Development Mode & Debugging Tools

**IMPORTANT: All dev features below are ONLY active in local development (`npm run dev`). They are completely disabled in production builds.**

#### Dev Configuration (src/config/DevConfig.ts)

The `DEV_CONFIG` provides enhanced debugging capabilities:

```typescript
export const DEV_CONFIG = {
  enabled: import.meta.env.DEV,  // Only true in development
  startingScore: 5000,            // vs 0 in production
  timerSeconds: 15,               // vs 60 in production
}
```

**Benefits:**
- **Fast Iteration**: 15-second rounds instead of 60 seconds
- **Immediate Shop Testing**: Start with 5000 points to test all upgrades
- **No Impact on Production**: Production builds use normal values (0 points, 60s rounds)

#### Dev Scene Navigation (src/game/DevSceneNavigator.ts)

Direct navigation to any game scene via URL parameters or browser console commands.

**URL Parameters** (Perfect for MCP Chrome DevTools):
```
http://localhost:5173?scene=shop&round=7&points=10000&score=15000
http://localhost:5173?scene=gameover&round=10&upgrades=phase_gun,tractor_beam
http://localhost:5173?scene=transition&round=5
http://localhost:5173?scene=game&round=3&points=5000
```

**Supported Parameters:**
- `scene` - game | shop | transition | gameover
- `round` - 1 to 10 (sets current round)
- `points` - Available points for shop purchases
- `score` - Total score
- `upgrades` - Comma-separated upgrade IDs (phase_gun, tractor_beam, bonus_time, time_dilation)

**Browser Console**: `window.debugNav` provides methods like `goToScene()`, `setRound()`, `addUpgrade()`, `showState()`, and `help()`.

#### UI Verification with MCP Chrome DevTools

**MANDATORY: When making UI changes to any scene, you MUST verify the changes using the MCP Chrome DevTools.**

**Workflow for Scene UI Changes:**

1. **Start dev server**: `npm run dev`

2. **Navigate to the scene** using MCP Chrome DevTools:
   ```javascript
   // Example: Verify ShopScene changes at round 5 with points
   mcp__chrome-devtools__navigate_page({
     url: 'http://localhost:5173?scene=shop&round=5&points=10000'
   })
   ```

3. **Take a snapshot** to verify layout:
   ```javascript
   mcp__chrome-devtools__take_snapshot()
   ```

4. **Take a screenshot** for visual confirmation:
   ```javascript
   mcp__chrome-devtools__take_screenshot({
     fullPage: true
   })
   ```

5. **Test interactivity** if needed:
   ```javascript
   // Example: Click a shop item
   mcp__chrome-devtools__click({ uid: 'element-uid-from-snapshot' })
   ```

6. **Check console for errors**:
   ```javascript
   mcp__chrome-devtools__list_console_messages()
   ```

**Common Scene Navigation URLs for Testing:**

- **GameScene (mid-game)**: `?scene=game&round=5&points=2000`
- **ShopScene (with funds)**: `?scene=shop&round=3&points=10000`
- **RoundTransitionScene**: `?scene=transition&round=7&score=8000`
- **GameOverScene**: `?scene=gameover&round=10&score=50000&upgrades=phase_gun,tractor_beam`

**Mobile Testing:**
```javascript
// Resize to mobile viewport
mcp__chrome-devtools__resize_page({ width: 375, height: 667 })

// Navigate to scene
mcp__chrome-devtools__navigate_page({
  url: 'http://localhost:5173?scene=shop&round=5&points=10000'
})

// Verify mobile layout
mcp__chrome-devtools__take_screenshot({ fullPage: true })
```

**Example: Complete UI Verification Flow**
```javascript
// 1. Navigate to shop at round 7 with plenty of points
mcp__chrome-devtools__navigate_page({
  url: 'http://localhost:5173?scene=shop&round=7&points=15000'
})

// 2. Wait for scene to load
mcp__chrome-devtools__wait_for({ text: 'Cosmic Shop' })

// 3. Take snapshot to verify layout
mcp__chrome-devtools__take_snapshot()

// 4. Take screenshot for visual record
mcp__chrome-devtools__take_screenshot({ fullPage: true })

// 5. Check for console errors
mcp__chrome-devtools__list_console_messages()
```

**When to Use Dev Navigation:**
- ✅ Testing shop UI changes (need points to see purchase options)
- ✅ Verifying game over screen (avoid playing 10 full rounds)
- ✅ Testing round transition layouts at different rounds
- ✅ Debugging upgrade effects at specific game states
- ✅ Mobile responsive testing for all scenes
- ✅ Screenshot documentation of UI states

### Testing Strategy

#### Unit Testing (Vitest)
- **Unit Tests**: Focus on pure logic without Phaser dependencies
  - MatchDetector (match detection, swap validation, config-driven)
  - GameConfigHelpers (speed multipliers, cost scaling, timer colors)
  - GameProgressManager (round progression, scoring)
  - ShopSystem (purchases, cost calculations, state management)
  - UpgradeManager (effect calculations)
- **Test Helpers**: Use `TileFactory` for creating mock game state
- **Mocking**: Tile class is mocked to avoid Phaser dependencies in tests
- **Coverage Goals**: All game logic should have unit tests
- **Current Coverage**: 116+ tests across 7 test files

#### End-to-End Testing (MCP Chrome DevTools)

**When to Run E2E Tests:**
- After refactoring core game logic or configuration
- Before committing significant changes
- To verify visual UI changes in browser

**E2E Test Workflow:**

1. Start dev server: `npm run dev`
2. Navigate to game homepage and start new game
3. Use `window.debugNav.goToScene('shop')` to test shop with points
4. Verify shop costs match `GameConfig.SHOP_ITEMS` values
5. Add upgrades via `debugNav.addUpgrade('phase_gun')` and test integration
6. Test speed multipliers at round 9 (verify "3x Speed!" messaging)
7. Check console for errors with `mcp__chrome-devtools__list_console_messages()`

**MCP Tools**: Use `navigate_page()`, `take_screenshot()`, `evaluate_script()`, `list_console_messages()` for testing.

**Common Test URLs:**
- Shop: `?scene=shop&round=3&points=10000`
- Game Over: `?scene=gameover&round=10&score=50000&upgrades=phase_gun`

**Note**: `getBoundingClientRect` errors in console are from MCP DevTools interacting with Phaser canvas, not game errors.