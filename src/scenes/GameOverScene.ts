import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { LeaderboardService } from '../services/LeaderboardService';
import { GAME_CONFIG } from '../types';
import type { ScoreSubmission } from '../types/Leaderboard';

export class GameOverScene extends Phaser.Scene {
  private leaderboardService!: LeaderboardService;
  private hasSubmitted: boolean = false;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  preload(): void {
    // Load ship SVGs for speed indicators
    this.load.svg('ship-normal', '/ships/normal.svg', { width: 20, height: 20 });
    this.load.svg('ship-medium', '/ships/medium.svg', { width: 20, height: 20 });
    this.load.svg('ship-fast', '/ships/fast.svg', { width: 20, height: 20 });
    this.load.svg('ship-ludicrous', '/ships/ludicrous.svg', { width: 20, height: 20 });

    this.leaderboardService = LeaderboardService.getInstance();
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

    // Leaderboard buttons
    const isMobile = GAME_CONFIG.IS_MOBILE;

    if (isMobile) {
      this.createMobileButtons(centerX);
    } else {
      this.createDesktopButtons(centerX);
    }

    // Add keyboard shortcut
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.startNewGame();
    });
  }

  private createDesktopButtons(centerX: number): void {
    const startY = 580;
    const btnHeight = 60;
    const gap = 15;

    // Submit to Leaderboard button
    this.createButton(
      centerX,
      startY,
      'Submit Score',
      () => this.promptForName(),
      0x10B981, // Green
      250,
      btnHeight
    );

    // View Leaderboard button (light yellow)
    this.createButton(
      centerX,
      startY + btnHeight + gap,
      'Leaderboard',
      () => this.scene.start('LeaderboardScene'),
      0xFBBF24, // Light yellow
      250,
      btnHeight
    );

    // Play again button
    this.createButton(
      centerX,
      startY + (btnHeight + gap) * 2,
      'Play Again',
      () => this.startNewGame(),
      0x00F5FF, // Cyan
      250,
      btnHeight
    );
  }

  private createMobileButtons(centerX: number): void {
    const screenHeight = this.cameras.main.height;
    const screenWidth = this.cameras.main.width;
    const bottomSafeArea = 80;
    const shelfHeight = 180; // Height for 3 buttons
    const btnHeight = 50;
    const gap = 8;

    // Create sticky shelf
    const shelf = this.add.rectangle(
      centerX,
      screenHeight - shelfHeight / 2 - bottomSafeArea,
      screenWidth,
      shelfHeight,
      0x1a1a1a
    );
    shelf.setScrollFactor(0);
    shelf.setDepth(1000);

    const border = this.add.rectangle(
      centerX,
      screenHeight - shelfHeight - bottomSafeArea,
      screenWidth,
      1,
      0x4a4a4a
    );
    border.setScrollFactor(0);
    border.setDepth(1000);

    const topPadding = 16;
    const buttonY1 = screenHeight - shelfHeight + topPadding + btnHeight / 2 - bottomSafeArea;
    const buttonY2 = buttonY1 + btnHeight + gap;
    const buttonY3 = buttonY2 + btnHeight + gap;

    // Submit button
    this.createButton(
      centerX,
      buttonY1,
      'Submit to Leaderboard',
      () => this.promptForName(),
      0x10B981,
      screenWidth - 32,
      btnHeight,
      true
    );

    // Leaderboard button (light yellow)
    this.createButton(
      centerX,
      buttonY2,
      'View Leaderboard',
      () => this.scene.start('LeaderboardScene'),
      0xFBBF24, // Light yellow
      screenWidth - 32,
      btnHeight,
      true
    );

    // Play again button
    this.createButton(
      centerX,
      buttonY3,
      'Play Again',
      () => this.startNewGame(),
      0x00F5FF,
      screenWidth - 32,
      btnHeight,
      true
    );
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    color: number,
    width: number,
    height: number,
    sticky: boolean = false
  ): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;

    const btn = this.add.rectangle(x, y, width, height, color);
    btn.setInteractive({ useHandCursor: true });
    if (sticky) {
      btn.setScrollFactor(0);
      btn.setDepth(1001);
    }

    const btnText = this.add.text(x, y, text, {
      fontSize: isMobile ? '18px' : '20px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    btnText.setOrigin(0.5);
    if (sticky) {
      btnText.setScrollFactor(0);
      btnText.setDepth(1002);
    }

    // Hover color based on button color
    let hoverColor: number;
    if (color === 0x10B981) hoverColor = 0x14D89A; // Green
    else if (color === 0xFBBF24) hoverColor = 0xFDE68A; // Light yellow -> lighter yellow
    else hoverColor = 0x00FFFF; // Cyan

    btn.on('pointerover', () => {
      btn.setFillStyle(hoverColor);
      if (!isMobile) {
        this.tweens.add({
          targets: btn,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
      }
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(color);
      btn.setScale(1);
    });

    btn.on('pointerdown', onClick);
  }

  private promptForName(): void {
    if (this.hasSubmitted) {
      return; // Already submitted
    }

    this.scene.launch('NameEntryScene', {
      onNameEntered: (name: string) => {
        this.submitToLeaderboard(name);
      }
    });
  }

  private async submitToLeaderboard(playerName: string): Promise<void> {
    const progressManager = GameProgressManager.getInstance();
    const progress = progressManager.getProgress();

    const submission: ScoreSubmission = {
      playerName,
      totalScore: progress.totalScore,
      roundsCompleted: progress.currentRound,
      livesRemaining: 0, // No lives system yet
      gameCompleted: progress.isComplete,
      upgradesPurchased: progress.ownedUpgrades.map((upgradeId, index) => ({
        upgradeId,
        purchaseCount: 1,
        roundPurchased: index + 1
      }))
    };

    const result = await this.leaderboardService.submitScore(submission);

    if (result.success) {
      this.hasSubmitted = true;

      // Navigate directly to leaderboard instead of showing success message
      this.scene.start('LeaderboardScene');
    } else {
      this.showSubmissionError(result.error);
    }
  }

  private showSubmissionError(error?: string): void {
    const centerX = this.cameras.main.width / 2;
    const isMobile = GAME_CONFIG.IS_MOBILE;

    const errorText = this.add.text(
      centerX,
      isMobile ? 180 : 200,
      `Failed to submit: ${error || 'Unknown error'}`,
      {
        fontSize: isMobile ? '16px' : '18px',
        color: '#FF6B6B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );
    errorText.setOrigin(0.5);
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