import * as Phaser from 'phaser';
import { GameProgressManager } from './GameProgressManager';

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
    this.speedMultiplier = progressManager.getTimerSpeedMultiplier();
    this.timeRemaining = progressManager.getRoundTimer(); // Always 60
    this.initializeUI();
    this.startTimer();
  }

  /**
   * Initializes all UI elements for displaying game state
   */
  private initializeUI(): void {
    // Position UI elements on the right side with proper spacing
    const uiX = 680;  // Further right to avoid overlap

    // Score display
    this.scoreText = this.scene.add.text(
      uiX,
      120,
      'Score: 0',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );

    // Timer display
    this.timerText = this.scene.add.text(
      uiX,
      160,
      this.formatTime(this.timeRemaining),
      {
        fontSize: '22px',
        color: '#F59E0B', // Solar Gold color
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );

    // Add clock emoji for visual appeal
    this.scene.add.text(
      uiX - 30,
      160,
      '⏱',
      {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif'
      }
    );

    // Combo indicator (hidden initially)
    this.comboText = this.scene.add.text(
      uiX,
      200,
      '',
      {
        fontSize: '18px',
        color: '#00F5FF', // Bright cyan for combos
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );

    // Game over text (hidden initially) - centered on screen
    this.gameOverText = this.scene.add.text(
      450,  // Center of 900px width
      350,
      '',
      {
        fontSize: '48px',
        color: '#EC4899', // Plasma Pink for emphasis
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
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
   * Updates the countdown timer with speed multiplier
   */
  private updateTimer(): void {
    if (this.isGameOver) return;

    // Decrease time by the speed multiplier amount
    this.timeRemaining -= this.speedMultiplier;
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

    // Show bonus animation
    const bonusText = this.scene.add.text(
      680,  // Match the uiX position
      240,  // Below combo text
      `+${seconds}s TIME!`,
      {
        fontSize: '20px',
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