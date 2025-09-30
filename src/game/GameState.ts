import * as Phaser from 'phaser';
import { GameProgressManager } from './GameProgressManager';
import { UpgradeManager } from './UpgradeManager';
import { ShopSystem } from './ShopSystem';
import { GAME_CONFIG } from '../types';

/**
 * Manages the game state including score, timer, combos, and UI updates
 * Now supports multi-round progression with speed multipliers
 */
export class GameState {
  private score: number = 0;
  private timeRemaining: number = 60; // Always displays as 60 seconds
  private actualTimeElapsed: number = 0; // Tracks real time for speed multiplier
  private currentCombo: number = 0;
  private highestCombo: number = 0;
  private totalCombos: number = 0; // Track total combos for round summary
  private isGameOver: boolean = false;
  private timerEvent?: Phaser.Time.TimerEvent;
  private onGameOverCallback?: () => void;
  private speedMultiplier: number = 1.0;

  // UI Text elements
  private scoreText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private gameOverText?: Phaser.GameObjects.Text;

  private scene: Phaser.Scene;

  // Score values for different actions
  private readonly BASE_TILE_SCORE = 10;
  private readonly COMBO_MULTIPLIER = 1.5;
  private readonly LONG_MATCH_BONUS = 50; // Bonus for 4+ matches
  private readonly TIME_BONUS_THRESHOLD = 5; // Combos of 5+ give time bonus

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const progressManager = GameProgressManager.getInstance();
    const upgradeManager = UpgradeManager.getInstance();
    const shopSystem = ShopSystem.getInstance();

    this.speedMultiplier = progressManager.getTimerSpeedMultiplier();

    // Apply time bonus upgrades to base timer
    const baseTime = progressManager.getRoundTimer(); // 60 seconds
    this.timeRemaining = upgradeManager.applyTimeBonus(baseTime);

    // Consume the time upgrades after applying them (one-time use per round)
    shopSystem.consumeTimeUpgrades();

    this.initializeUI();
    this.startTimer();
  }

  /**
   * Initializes all UI elements for displaying game state
   */
  private initializeUI(): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    // Position UI elements responsively
    // On mobile: below the grid, on desktop: right side
    let timerX: number;
    let scoreX: number;
    let uiY: number;

    if (isMobile) {
      // Calculate position below the 8x8 grid
      const gridHeight = (GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SPACING) * GAME_CONFIG.GRID_HEIGHT;
      uiY = GAME_CONFIG.BOARD_OFFSET_Y + gridHeight + 15;

      // Timer left-aligned, Score right-aligned
      timerX = GAME_CONFIG.BOARD_OFFSET_X;
      const gridWidth = (GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SPACING) * GAME_CONFIG.GRID_WIDTH;
      scoreX = GAME_CONFIG.BOARD_OFFSET_X + gridWidth;
    } else {
      // Desktop: Position UI in top-right corner of canvas
      // Grid is centered at 196-704, so position UI at right edge
      timerX = 750; // Right side of canvas
      scoreX = 750;
      uiY = 120;
    }

    // Responsive font sizes (larger on mobile now that they're below grid)
    const fontSize = {
      score: isMobile ? '22px' : '24px',
      timer: isMobile ? '20px' : '22px',
      combo: isMobile ? '16px' : '18px',
      gameOver: isMobile ? '32px' : '48px'
    };

    if (isMobile) {
      // Mobile layout: Timer left, Score right on same row

      // Timer display with clock emoji (left aligned)
      this.scene.add.text(
        timerX,
        uiY,
        '⏱',
        {
          fontSize: fontSize.timer,
          fontFamily: 'Arial, sans-serif'
        }
      );

      this.timerText = this.scene.add.text(
        timerX + 22,
        uiY,
        this.formatTime(this.timeRemaining),
        {
          fontSize: fontSize.timer,
          color: '#F59E0B', // Solar Gold color
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );

      // Score display (right aligned)
      this.scoreText = this.scene.add.text(
        scoreX,
        uiY,
        'Score: 0',
        {
          fontSize: fontSize.score,
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );
      this.scoreText.setOrigin(1, 0); // Right-align the text

      uiY += parseInt(fontSize.timer) + 8;

      // Combo indicator (hidden initially) - centered below
      const centerX = GAME_CONFIG.BOARD_OFFSET_X + ((GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SPACING) * GAME_CONFIG.GRID_WIDTH) / 2;
      this.comboText = this.scene.add.text(
        centerX,
        uiY,
        '',
        {
          fontSize: fontSize.combo,
          color: '#00F5FF', // Bright cyan for combos
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      );
      this.comboText.setOrigin(0.5, 0); // Center the text
    } else {
      // Desktop layout: Score above Timer

      // Score display
      this.scoreText = this.scene.add.text(
        scoreX,
        uiY,
        'Score: 0',
        {
          fontSize: fontSize.score,
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );

      uiY += parseInt(fontSize.score) + 10;

      // Timer display with clock emoji
      this.scene.add.text(
        timerX - 30,
        uiY,
        '⏱',
        {
          fontSize: fontSize.timer,
          fontFamily: 'Arial, sans-serif'
        }
      );

      this.timerText = this.scene.add.text(
        timerX,
        uiY,
        this.formatTime(this.timeRemaining),
        {
          fontSize: fontSize.timer,
          color: '#F59E0B', // Solar Gold color
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );

      uiY += parseInt(fontSize.timer) + 10;

      // Combo indicator (hidden initially)
      this.comboText = this.scene.add.text(
        timerX,
        uiY,
        '',
        {
          fontSize: fontSize.combo,
          color: '#00F5FF', // Bright cyan for combos
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      );
    }

    // Game over text (hidden initially) - centered on screen
    this.gameOverText = this.scene.add.text(
      screenWidth / 2,
      screenHeight / 2,
      '',
      {
        fontSize: fontSize.gameOver,
        color: '#EC4899', // Plasma Pink for emphasis
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: isMobile ? 2 : 4,
        align: 'center'
      }
    );
    this.gameOverText.setOrigin(0.5, 0.5);
    this.gameOverText.setVisible(false);
  }

  /**
   * Starts the countdown timer with speed multiplier support
   */
  private startTimer(): void {
    // Update timer every second (real time)
    this.timerEvent = this.scene.time.addEvent({
      delay: 1000, // 1 second real time
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Updates the countdown timer with speed multiplier and time dilation
   */
  private updateTimer(): void {
    if (this.isGameOver) return;

    // Get time dilation slowdown effect
    const upgradeManager = UpgradeManager.getInstance();
    const slowdownAmount = upgradeManager.getTimerSlowdown();

    // Calculate effective timer decrease: speed multiplier minus slowdown
    // Example: speedMultiplier = 1.5, slowdown = 0.5 -> effective = 1.0
    const effectiveDecrease = Math.max(0.1, this.speedMultiplier - slowdownAmount);

    // Decrease time by the effective amount
    this.timeRemaining -= effectiveDecrease;
    this.actualTimeElapsed += 1; // Track real seconds elapsed

    // Ensure time doesn't go negative
    if (this.timeRemaining < 0) {
      this.timeRemaining = 0;
    }

    this.updateTimerDisplay();

    // Check for game over
    if (this.timeRemaining <= 0) {
      this.endGame();
    }
  }

  /**
   * Formats time as MM:SS
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Updates the timer display with color coding
   */
  private updateTimerDisplay(): void {
    if (!this.timerText) return;

    this.timerText.setText(this.formatTime(this.timeRemaining));

    // Color coding based on remaining time
    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#EC4899'); // Plasma Pink for danger

      // Pulse animation for urgency
      this.scene.tweens.add({
        targets: this.timerText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Power2.easeOut',
        yoyo: true
      });
    } else if (this.timeRemaining <= 30) {
      this.timerText.setColor('#F59E0B'); // Solar Gold for warning
    } else {
      this.timerText.setColor('#00F5FF'); // Bright cyan for normal
    }
  }

  /**
   * Calculates and adds score for matched tiles
   * @param matchGroups - Array of match groups from the detector
   * @param cascadeNumber - Which cascade this is (for multiplier)
   */
  public addMatchScore(matchGroups: any[][], cascadeNumber: number): void {
    let matchScore = 0;

    // Calculate base score for all matched tiles
    matchGroups.forEach(group => {
      const tileCount = group.length;

      // Base score for each tile
      matchScore += tileCount * this.BASE_TILE_SCORE;

      // Bonus for long matches (4+ tiles)
      if (tileCount >= 4) {
        matchScore += this.LONG_MATCH_BONUS * (tileCount - 3);
        console.log(`Long match bonus! ${tileCount} tiles in a row!`);
      }
    });

    // Apply cascade combo multiplier
    if (cascadeNumber > 1) {
      const multiplier = Math.pow(this.COMBO_MULTIPLIER, cascadeNumber - 1);
      matchScore = Math.round(matchScore * multiplier);

      this.currentCombo = cascadeNumber;
      this.updateComboDisplay();

      // Award bonus time for big combos!
      if (cascadeNumber >= this.TIME_BONUS_THRESHOLD) {
        const bonusTime = (cascadeNumber - this.TIME_BONUS_THRESHOLD + 1) * 2; // 2 seconds per combo level above threshold
        this.addBonusTime(bonusTime);
      }

      // Track total combos achieved
      this.totalCombos++;

      console.log(`Cascade x${cascadeNumber}! Score multiplier: ${multiplier.toFixed(2)}x`);
    } else {
      this.currentCombo = 0;
      this.updateComboDisplay();
    }

    // Update highest combo
    if (this.currentCombo > this.highestCombo) {
      this.highestCombo = this.currentCombo;
    }

    // Add to total score with animation
    this.animateScoreIncrease(this.score, this.score + matchScore);
    this.score += matchScore;
  }

  /**
   * Animates the score counter increasing
   */
  private animateScoreIncrease(from: number, to: number): void {
    const duration = 500; // Half second animation

    this.scene.tweens.add({
      targets: { value: from },
      value: to,
      duration: duration,
      ease: 'Power2.easeOut',
      onUpdate: (tween) => {
        const rawValue = tween.getValue();
        if (typeof rawValue === 'number') {
          const value = Math.round(rawValue);
          if (this.scoreText) {
            this.scoreText.setText(`Score: ${value.toLocaleString()}`);
          }
        }
      }
    });

    // Pulse effect on score text
    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: duration / 4,
      ease: 'Power2.easeOut',
      yoyo: true
    });
  }

  /**
   * Updates the combo display
   */
  private updateComboDisplay(): void {
    if (!this.comboText) return;

    if (this.currentCombo > 1) {
      this.comboText.setText(`COMBO x${this.currentCombo}!`);
      this.comboText.setVisible(true);

      // Animate combo text
      this.scene.tweens.add({
        targets: this.comboText,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 1,
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Fade out after a moment
          this.scene.tweens.add({
            targets: this.comboText,
            alpha: 0,
            duration: 1000,
            delay: 500,
            ease: 'Power2.easeIn'
          });
        }
      });
    } else {
      this.comboText.setVisible(false);
    }
  }

  /**
   * Adds bonus time for big combos
   * @param seconds - Number of seconds to add
   */
  private addBonusTime(seconds: number): void {
    this.timeRemaining += seconds;
    this.updateTimerDisplay();

    const isMobile = GAME_CONFIG.IS_MOBILE;

    // Position relative to timer
    let bonusX: number;
    let bonusY: number;

    if (isMobile) {
      const gridHeight = (GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SPACING) * GAME_CONFIG.GRID_HEIGHT;
      bonusY = GAME_CONFIG.BOARD_OFFSET_Y + gridHeight + 85; // Below timer
      bonusX = GAME_CONFIG.BOARD_OFFSET_X;
    } else {
      bonusX = 680;
      bonusY = 240;
    }

    // Show bonus animation
    const bonusText = this.scene.add.text(
      bonusX,
      bonusY,
      `+${seconds}s TIME!`,
      {
        fontSize: isMobile ? '18px' : '20px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );

    this.scene.tweens.add({
      targets: bonusText,
      y: bonusText.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => bonusText.destroy()
    });
  }

  /**
   * Triggers game over state (round end)
   */
  private endGame(): void {
    this.isGameOver = true;

    // Stop the timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // Call the game over callback to hide the grid and transition
    if (this.onGameOverCallback) {
      this.onGameOverCallback();
    }

    // Don't show game over text here - will be handled by RoundTransitionScene
    console.log(`Round Complete! Score: ${this.score}, Best Combo: x${this.highestCombo}`);
  }

  /**
   * Sets the callback function for when game ends
   */
  public setGameOverCallback(callback: () => void): void {
    this.onGameOverCallback = callback;
  }

  /**
   * Resets the combo counter (called when no cascade occurs)
   */
  public resetCombo(): void {
    this.currentCombo = 0;
    this.updateComboDisplay();
  }

  /**
   * Gets current game over state
   */
  public getIsGameOver(): boolean {
    return this.isGameOver;
  }

  /**
   * Gets current score
   */
  public getScore(): number {
    return this.score;
  }

  /**
   * Gets remaining time
   */
  public getTimeRemaining(): number {
    return this.timeRemaining;
  }

  /**
   * Gets total combos achieved this round
   */
  public getTotalCombos(): number {
    return this.totalCombos;
  }

  /**
   * Cleanup method
   */
  public destroy(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
  }
}