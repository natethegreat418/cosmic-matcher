import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { LocalStorageManager } from '../services/LocalStorageManager';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  preload(): void {
    // Load ship SVGs for speed indicators
    this.load.svg('ship-normal', '/ships/normal.svg', { width: 20, height: 20 });
    this.load.svg('ship-medium', '/ships/medium.svg', { width: 20, height: 20 });
    this.load.svg('ship-fast', '/ships/fast.svg', { width: 20, height: 20 });
    this.load.svg('ship-ludicrous', '/ships/ludicrous.svg', { width: 20, height: 20 });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const progressManager = GameProgressManager.getInstance();
    const progress = progressManager.getProgress();

    // Clear saved game - game is complete
    LocalStorageManager.clearSave();

    // Background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Game complete header
    const headerText = this.add.text(
      centerX,
      60,
      'CAMPAIGN COMPLETE!',
      {
        fontSize: '48px',
        color: '#EC4899', // Plasma pink
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

    // Final score with animation
    const finalScoreText = this.add.text(
      centerX,
      130,
      `Final Score: 0`,
      {
        fontSize: '36px',
        color: '#F59E0B', // Solar gold
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    finalScoreText.setOrigin(0.5, 0.5);

    // Animate score counting up
    this.tweens.add({
      targets: { value: 0 },
      value: progress.totalScore,
      duration: 2000,
      ease: 'Power2.easeOut',
      onUpdate: (tween) => {
        const rawValue = tween.getValue();
        if (typeof rawValue === 'number') {
          const value = Math.round(rawValue);
          finalScoreText.setText(`Final Score: ${value.toLocaleString()}`);
        }
      }
    });

    // Stats header
    this.add.text(
      centerX,
      200,
      'Round Breakdown',
      {
        fontSize: '24px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5);

    // Round scores in two columns
    this.displayRoundScores(centerX, 240, progress.roundScores);

    // Statistics
    const stats = this.calculateStatistics(progress.roundScores);
    const statsY = 460;

    // Best round
    this.add.text(
      centerX - 150,
      statsY,
      `Best Round: ${stats.bestRound}`,
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    this.add.text(
      centerX - 150,
      statsY + 25,
      `Score: ${stats.bestScore.toLocaleString()}`,
      {
        fontSize: '16px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    // Average score
    this.add.text(
      centerX + 150,
      statsY,
      `Average Score:`,
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    this.add.text(
      centerX + 150,
      statsY + 25,
      `${stats.averageScore.toLocaleString()}`,
      {
        fontSize: '16px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    // Performance rating
    const rating = this.getPerformanceRating(progress.totalScore);
    const ratingText = this.add.text(
      centerX,
      540,
      rating.text,
      {
        fontSize: '28px',
        color: rating.color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    ratingText.setOrigin(0.5, 0.5);

    // Animate rating
    this.tweens.add({
      targets: ratingText,
      scale: { from: 0, to: 1 },
      duration: 500,
      delay: 2000,
      ease: 'Back.easeOut'
    });

    // Play again button
    const playAgainBtn = this.add.rectangle(
      centerX,
      610,
      200,
      60,
      0x00F5FF
    );
    playAgainBtn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(
      centerX,
      610,
      'Play Again',
      {
        fontSize: '24px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    btnText.setOrigin(0.5, 0.5);

    // Button hover effect
    playAgainBtn.on('pointerover', () => {
      playAgainBtn.setFillStyle(0x00FFFF);
      this.tweens.add({
        targets: playAgainBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    playAgainBtn.on('pointerout', () => {
      playAgainBtn.setFillStyle(0x00F5FF);
      playAgainBtn.setScale(1);
    });

    playAgainBtn.on('pointerdown', () => {
      this.startNewGame();
    });

    // Add keyboard shortcut
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.startNewGame();
    });
  }

  private displayRoundScores(centerX: number, startY: number, scores: number[]): void {
    const columnWidth = 200;
    const leftX = centerX - columnWidth / 2;
    const rightX = centerX + columnWidth / 2;
    const lineHeight = 30;

    // Display rounds 1-5 in left column, 6-10 in right column
    scores.forEach((score, index) => {
      const roundNumber = index + 1;
      const isLeftColumn = roundNumber <= 5;
      const x = isLeftColumn ? leftX : rightX;
      const y = startY + ((roundNumber - 1) % 5) * lineHeight;

      // Round label
      this.add.text(
        x - 40,
        y,
        `Round ${roundNumber}:`,
        {
          fontSize: '16px',
          color: '#888888',
          fontFamily: 'Arial, sans-serif'
        }
      ).setOrigin(0.5, 0.5);

      // Score with speed indicator

      // Calculate what the speed was for that round
      let speedMultiplier = 1.0;
      if (roundNumber <= 2) speedMultiplier = 1.0;
      else if (roundNumber <= 4) speedMultiplier = 1.5;
      else if (roundNumber <= 6) speedMultiplier = 2.0;
      else if (roundNumber <= 8) speedMultiplier = 2.5;
      else speedMultiplier = 3.0;

      const speedIndicator = speedMultiplier > 1 ? ` (${speedMultiplier}x)` : '';

      this.add.text(
        x + 40,
        y,
        `${score.toLocaleString()}${speedIndicator}`,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif'
        }
      ).setOrigin(0.5, 0.5);
    });
  }

  private calculateStatistics(scores: number[]): {
    bestRound: number;
    bestScore: number;
    averageScore: number;
  } {
    let bestRound = 1;
    let bestScore = scores[0] || 0;

    scores.forEach((score, index) => {
      if (score > bestScore) {
        bestScore = score;
        bestRound = index + 1;
      }
    });

    const averageScore = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );

    return {
      bestRound,
      bestScore,
      averageScore
    };
  }

  private getPerformanceRating(totalScore: number): { text: string; color: string } {
    if (totalScore >= 50000) {
      return { text: '⭐ COSMIC MASTER ⭐', color: '#EC4899' };
    } else if (totalScore >= 35000) {
      return { text: '🌟 STELLAR PERFORMANCE 🌟', color: '#F59E0B' };
    } else if (totalScore >= 20000) {
      return { text: '✨ SPACE CADET ✨', color: '#00F5FF' };
    } else if (totalScore >= 10000) {
      return { text: 'ROOKIE PILOT', color: '#ffffff' };
    } else {
      return { text: 'KEEP PRACTICING!', color: '#888888' };
    }
  }

  private startNewGame(): void {
    // Reset progress and start fresh
    const progressManager = GameProgressManager.getInstance();
    progressManager.startNewGame();

    // Start from round 1
    this.scene.start('GameScene');
  }
}