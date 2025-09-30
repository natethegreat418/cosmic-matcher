import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import type { RoundResult } from '../types/Progress';

export class RoundTransitionScene extends Phaser.Scene {
  private roundResult?: RoundResult;

  constructor() {
    super({ key: 'RoundTransitionScene' });
  }

  init(data: { roundResult: RoundResult }): void {
    this.roundResult = data.roundResult;
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const progressManager = GameProgressManager.getInstance();

    // Background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Round complete header
    const headerText = this.add.text(
      centerX,
      100,
      `Round ${this.roundResult!.roundNumber} Complete!`,
      {
        fontSize: '48px',
        color: '#00F5FF', // Bright cyan
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    headerText.setOrigin(0.5, 0.5);

    // Animate header
    this.tweens.add({
      targets: headerText,
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Round score
    this.add.text(
      centerX,
      200,
      `Round Score: ${this.roundResult!.score.toLocaleString()}`,
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    // Total score
    const totalText = this.add.text(
      centerX,
      250,
      `Total Score: ${progressManager.getTotalScore().toLocaleString()}`,
      {
        fontSize: '32px',
        color: '#F59E0B', // Solar gold
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    totalText.setOrigin(0.5, 0.5);

    // Progress indicator
    this.createProgressIndicator(centerX, 340);

    // Next round preview with speed warning
    const nextRound = progressManager.getCurrentRound();
    if (nextRound <= 10) {
      const speedMultiplier = progressManager.getTimerSpeedMultiplier();
      let speedWarning = '';

      if (speedMultiplier > 1) {
        speedWarning = ` (${speedMultiplier}x Speed!)`;
      }

      this.add.text(
        centerX,
        420,
        `Next: Round ${nextRound}${speedWarning}`,
        {
          fontSize: '20px',
          color: speedMultiplier > 2 ? '#EC4899' : '#ffffff', // Pink for high speed
          fontFamily: 'Arial, sans-serif',
          fontStyle: speedMultiplier > 1 ? 'italic' : 'normal'
        }
      ).setOrigin(0.5, 0.5);
    }

    // Continue button
    const continueBtn = this.add.rectangle(
      centerX,
      500,
      200,
      60,
      0x00F5FF
    );
    continueBtn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(
      centerX,
      500,
      nextRound <= 10 ? 'Visit Shop' : 'View Results',
      {
        fontSize: '24px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    btnText.setOrigin(0.5, 0.5);

    // Button hover effect
    continueBtn.on('pointerover', () => {
      continueBtn.setFillStyle(0x00FFFF);
      this.tweens.add({
        targets: continueBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    continueBtn.on('pointerout', () => {
      continueBtn.setFillStyle(0x00F5FF);
      continueBtn.setScale(1);
    });

    continueBtn.on('pointerdown', () => {
      this.proceedToNext();
    });

    // Add keyboard shortcut
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.proceedToNext();
    });

    // Hint text
    this.add.text(
      centerX,
      560,
      'Press SPACE to continue',
      {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);
  }

  private createProgressIndicator(centerX: number, y: number): void {
    const currentRound = this.roundResult!.roundNumber;
    const dotSpacing = 50;
    const startX = centerX - (9 * dotSpacing) / 2;

    // Create dots for rounds 1-10
    for (let i = 1; i <= 10; i++) {
      const x = startX + (i - 1) * dotSpacing;

      let color: number;
      if (i < currentRound) {
        color = 0x00F5FF; // Completed - bright cyan
      } else if (i === currentRound) {
        color = 0xF59E0B; // Just completed - solar gold
      } else {
        color = 0x444444; // Not reached - dark gray
      }

      const dot = this.add.circle(x, y, 15, color);

      // Add round number
      this.add.text(
        x,
        y,
        i.toString(),
        {
          fontSize: '12px',
          color: i <= currentRound ? '#000000' : '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5, 0.5);

      // Animate current round dot
      if (i === currentRound) {
        this.tweens.add({
          targets: dot,
          scale: { from: 1, to: 1.2 },
          duration: 500,
          ease: 'Power2',
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  private proceedToNext(): void {
    const progressManager = GameProgressManager.getInstance();

    if (progressManager.isGameComplete()) {
      // Go to final game over scene
      this.scene.start('GameOverScene');
    } else {
      // Go to shop before next round
      this.scene.start('ShopScene');
    }
  }
}