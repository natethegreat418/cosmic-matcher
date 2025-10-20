import * as Phaser from 'phaser';
import { GameProgressManager } from './GameProgressManager';
import { UpgradeManager } from './UpgradeManager';
import { ShopSystem } from './ShopSystem';
import { GAME_CONFIG, type MatchGroup } from '../types';
import { getGameSceneLayout, isMobile } from '../config/ResponsiveConfig';
import { SCORING, TIMER_CONFIG, GameConfigHelpers } from '../config/GameConfig';

/**
 * Manages the game state including score, timer, combos, and UI updates
 * Now supports multi-round progression with speed multipliers
 */
export class GameState {
  private score: number = 0;
  private timeRemaining: number = 60; // 60 in production, configurable in dev (initialized from GameProgressManager)
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const progressManager = GameProgressManager.getInstance();
    const upgradeManager = UpgradeManager.getInstance();
    const shopSystem = ShopSystem.getInstance();

    this.speedMultiplier = progressManager.getTimerSpeedMultiplier();

    // Apply time bonus upgrades to base timer
    const baseTime = progressManager.getRoundTimer(); // 60 in production, configurable in dev
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
    const mobile = isMobile();
    const layout = getGameSceneLayout();
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    if (mobile) {
      // Mobile layout: Timer bottom-left, Score bottom-right
      const { footer } = layout;
      if (!footer) throw new Error('Footer layout not defined for mobile');

      // Timer display (left aligned)
      this.timerText = this.scene.add.text(
        footer.timer.x,
        footer.timer.y,
        this.formatTime(this.timeRemaining),
        {
          fontSize: footer.timer.fontSize,
          color: '#00F5FF', // Cyan for timer
          fontFamily: 'Arial, sans-serif',
          fontStyle: footer.timer.fontWeight
        }
      );

      // Score display (right aligned)
      this.scoreText = this.scene.add.text(
        footer.score.x,
        footer.score.y,
        '0',
        {
          fontSize: footer.score.fontSize,
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: footer.score.fontWeight
        }
      );
      this.scoreText.setOrigin(1, 0);

      // Combo indicator (hidden initially) - positioned from config
      this.comboText = this.scene.add.text(
        layout.combo!.x,
        layout.combo!.y,
        '',
        {
          fontSize: layout.combo!.fontSize,
          color: '#00F5FF',
          fontFamily: 'Arial, sans-serif',
          fontStyle: layout.combo!.fontWeight
        }
      );
      this.comboText.setOrigin(0.5, 0);
    } else {
      // Desktop layout: Timer and Score in top-right
      const { headerRight } = layout;

      // Score display
      this.scoreText = this.scene.add.text(
        headerRight!.score.x,
        headerRight!.score.y,
        '0',
        {
          fontSize: headerRight!.score.fontSize,
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: headerRight!.score.fontWeight
        }
      );
      this.scoreText.setOrigin(1, 0);

      // Timer display
      this.timerText = this.scene.add.text(
        headerRight!.timer.x,
        headerRight!.timer.y,
        this.formatTime(this.timeRemaining),
        {
          fontSize: headerRight!.timer.fontSize,
          color: '#00F5FF', // Cyan for timer
          fontFamily: 'Arial, sans-serif',
          fontStyle: headerRight!.timer.fontWeight
        }
      );
      this.timerText.setOrigin(1, 0);

      // Combo indicator (hidden initially) - positioned from config
      this.comboText = this.scene.add.text(
        layout.combo!.x,
        layout.combo!.y,
        '',
        {
          fontSize: layout.combo!.fontSize,
          color: '#00F5FF',
          fontFamily: 'Arial, sans-serif',
          fontStyle: layout.combo!.fontWeight
        }
      );
      this.comboText.setOrigin(1, 0); // Right-aligned on desktop
    }

    // Game over text (hidden initially) - centered on screen
    this.gameOverText = this.scene.add.text(
      screenWidth / 2,
      screenHeight / 2,
      '',
      {
        fontSize: mobile ? '32px' : '48px',
        color: '#EC4899',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: mobile ? 2 : 4,
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
    const timerColor = GameConfigHelpers.getTimerColor(this.timeRemaining);
    this.timerText.setColor(timerColor);

    // Pulse animation for urgency when in danger zone
    if (this.timeRemaining <= TIMER_CONFIG.COLOR_THRESHOLDS.DANGER) {
      this.scene.tweens.add({
        targets: this.timerText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Power2.easeOut',
        yoyo: true
      });
    }
  }

  /**
   * Calculates and adds score for matched tiles
   * @param matchGroups - Array of match groups from the detector
   * @param cascadeNumber - Which cascade this is (for multiplier)
   */
  public addMatchScore(matchGroups: MatchGroup[], cascadeNumber: number): void {
    let matchScore = 0;

    // Calculate base score for all matched tiles
    matchGroups.forEach(group => {
      const tileCount = group.length;

      // Base score for each tile
      matchScore += tileCount * SCORING.BASE_TILE_SCORE;

      // Bonus for long matches (4+ tiles)
      if (tileCount >= 4) {
        matchScore += SCORING.LONG_MATCH_BONUS * (tileCount - 3);
        console.log(`Long match bonus! ${tileCount} tiles (${group.direction}) in a row!`);
      }
    });

    // Apply cascade combo multiplier
    if (cascadeNumber > 1) {
      const multiplier = Math.pow(SCORING.COMBO_MULTIPLIER, cascadeNumber - 1);
      matchScore = Math.round(matchScore * multiplier);

      this.currentCombo = cascadeNumber;
      this.updateComboDisplay();

      // Award bonus time for big combos!
      if (cascadeNumber >= SCORING.TIME_BONUS_THRESHOLD) {
        const bonusTime = (cascadeNumber - SCORING.TIME_BONUS_THRESHOLD + 1) * SCORING.COMBO_BONUS_TIME_SECONDS;
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
            this.scoreText.setText(value.toLocaleString());
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