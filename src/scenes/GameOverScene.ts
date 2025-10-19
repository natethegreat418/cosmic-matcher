import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { LeaderboardService } from '../services/LeaderboardService';
import { getCampaignCompleteLayout, isMobile } from '../config/ResponsiveConfig';
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
    const mobile = isMobile();
    const layout = getCampaignCompleteLayout();

    // Clear saved game - game is complete
    LocalStorageManager.clearSave();

    // Background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Game complete header
    const headerText = this.add.text(
      centerX,
      layout.title.y,
      'CAMPAIGN COMPLETE!',
      {
        fontSize: layout.title.fontSize,
        color: '#EC4899', // Plasma pink
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: mobile ? 2 : 3
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
      layout.finalScore.y,
      `Final Score: 0`,
      {
        fontSize: layout.finalScore.fontSize,
        color: '#F59E0B', // Solar gold
        fontFamily: 'Arial, sans-serif',
        fontStyle: layout.finalScore.fontWeight
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
      layout.breakdown.titleY,
      'Round Breakdown',
      {
        fontSize: layout.breakdown.titleSize,
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5);

    // Round scores in two columns
    this.displayRoundScores(centerX, layout.breakdown.startY, progress.roundScores);

    // Statistics - display on both mobile and desktop
    const stats = this.calculateStatistics(progress.roundScores);
    const statsY = layout.stats.startY;

    if (layout.stats.display && !mobile) {
      // Desktop: stack vertically to prevent overlap
      const isVertical = layout.stats.layout === 'vertical';

      if (isVertical) {
        // Best round
        this.add.text(
          centerX,
          statsY,
          `Best Round: ${stats.bestRound}  •  Score: ${stats.bestScore.toLocaleString()}`,
          {
            fontSize: layout.stats.labelSize,
            color: '#00F5FF',
            fontFamily: 'Arial, sans-serif'
          }
        ).setOrigin(0.5, 0.5);

        // Average score
        this.add.text(
          centerX,
          statsY + layout.stats.gap + 30,
          `Average Score: ${stats.averageScore.toLocaleString()}`,
          {
            fontSize: layout.stats.labelSize,
            color: '#00F5FF',
            fontFamily: 'Arial, sans-serif'
          }
        ).setOrigin(0.5, 0.5);
      }
    } else if (mobile && layout.stats.display) {
      // Mobile: also show stats, stacked vertically
      this.add.text(
        centerX,
        statsY,
        `Best: Round ${stats.bestRound} (${stats.bestScore.toLocaleString()})`,
        {
          fontSize: layout.stats.labelSize,
          color: '#00F5FF',
          fontFamily: 'Arial, sans-serif'
        }
      ).setOrigin(0.5, 0.5);

      this.add.text(
        centerX,
        statsY + layout.stats.gap + 20,
        `Avg: ${stats.averageScore.toLocaleString()}`,
        {
          fontSize: layout.stats.labelSize,
          color: '#00F5FF',
          fontFamily: 'Arial, sans-serif'
        }
      ).setOrigin(0.5, 0.5);
    }

    // Performance rating
    const rating = this.getPerformanceRating(progress.totalScore);
    const ratingText = this.add.text(
      centerX,
      layout.encouragement.y,
      rating.text,
      {
        fontSize: layout.encouragement.fontSize,
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
    if (mobile) {
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
    const layout = getCampaignCompleteLayout();
    const { buttons } = layout;
    const btnY = buttons.y || 580;

    // Submit to Leaderboard button (Primary action)
    this.createButton(
      centerX,
      btnY,
      'Submit Score',
      () => this.promptForName(),
      0x00F5FF, // Primary: Bright Cyan
      buttons.buttonWidth || 250,
      buttons.buttonHeight
    );

    // View Leaderboard button (Secondary action)
    this.createButton(
      centerX,
      btnY + buttons.buttonHeight + buttons.gap,
      'Leaderboard',
      () => this.scene.start('LeaderboardScene'),
      0xF59E0B, // Secondary: Solar Gold
      buttons.buttonWidth || 250,
      buttons.buttonHeight
    );

    // Play again button (Primary action)
    this.createButton(
      centerX,
      btnY + (buttons.buttonHeight + buttons.gap) * 2,
      'Play Again',
      () => this.startNewGame(),
      0x00F5FF, // Primary: Bright Cyan
      buttons.buttonWidth || 250,
      buttons.buttonHeight
    );
  }

  private createMobileButtons(centerX: number): void {
    const screenHeight = this.cameras.main.height;
    const screenWidth = this.cameras.main.width;
    const layout = getCampaignCompleteLayout();
    const { buttons } = layout;

    const bottomSafeArea = layout.buttons.startY ? (screenHeight - layout.buttons.startY) : 140;
    const shelfHeight = buttons.buttonHeight * 3 + buttons.gap * 2 + 32;

    // Create sticky shelf
    const shelf = this.add.rectangle(
      centerX,
      screenHeight - shelfHeight / 2 - bottomSafeArea + buttons.buttonHeight,
      screenWidth,
      shelfHeight,
      0x1a1a1a
    );
    shelf.setScrollFactor(0);
    shelf.setDepth(1000);

    const border = this.add.rectangle(
      centerX,
      screenHeight - shelfHeight - bottomSafeArea + buttons.buttonHeight,
      screenWidth,
      1,
      0x4a4a4a
    );
    border.setScrollFactor(0);
    border.setDepth(1000);

    const topPadding = 16;
    const buttonY1 = screenHeight - shelfHeight + topPadding + buttons.buttonHeight / 2 - bottomSafeArea + buttons.buttonHeight;
    const buttonY2 = buttonY1 + buttons.buttonHeight + buttons.gap;
    const buttonY3 = buttonY2 + buttons.buttonHeight + buttons.gap;

    // Submit button (Primary action)
    this.createButton(
      centerX,
      buttonY1,
      'Submit to Leaderboard',
      () => this.promptForName(),
      0x00F5FF, // Primary: Bright Cyan
      screenWidth - 32,
      buttons.buttonHeight,
      true
    );

    // Leaderboard button (Secondary action)
    this.createButton(
      centerX,
      buttonY2,
      'View Leaderboard',
      () => this.scene.start('LeaderboardScene'),
      0xF59E0B, // Secondary: Solar Gold
      screenWidth - 32,
      buttons.buttonHeight,
      true
    );

    // Play again button (Primary action)
    this.createButton(
      centerX,
      buttonY3,
      'Play Again',
      () => this.startNewGame(),
      0x00F5FF, // Primary: Bright Cyan
      screenWidth - 32,
      buttons.buttonHeight,
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
    const layout = getCampaignCompleteLayout();
    const mobile = isMobile();

    const btn = this.add.rectangle(x, y, width, height, color);
    btn.setInteractive({ useHandCursor: true });
    if (sticky) {
      btn.setScrollFactor(0);
      btn.setDepth(1001);
    }

    const btnText = this.add.text(x, y, text, {
      fontSize: layout.buttons.fontSize,
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
    if (color === 0x00F5FF) hoverColor = 0x66FFFF; // Primary hover: Lighter Bright Cyan
    else if (color === 0xF59E0B) hoverColor = 0xFFBF40; // Secondary hover: Lighter Solar Gold
    else hoverColor = 0x66FFFF; // Default to primary hover

    btn.on('pointerover', () => {
      btn.setFillStyle(hoverColor);
      if (!mobile) {
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
    const mobile = isMobile();

    const errorText = this.add.text(
      centerX,
      mobile ? 180 : 200,
      `Failed to submit: ${error || 'Unknown error'}`,
      {
        fontSize: mobile ? '16px' : '18px',
        color: '#FF6B6B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );
    errorText.setOrigin(0.5);
  }

  private displayRoundScores(centerX: number, startY: number, scores: number[]): void {
    const layout = getCampaignCompleteLayout();
    const columnWidth = 200;
    const leftX = centerX - columnWidth / 2;
    const rightX = centerX + columnWidth / 2;

    // Display rounds 1-5 in left column, 6-10 in right column
    scores.forEach((score, index) => {
      const roundNumber = index + 1;
      const isLeftColumn = roundNumber <= 5;
      const x = isLeftColumn ? leftX : rightX;
      const y = startY + ((roundNumber - 1) % 5) * layout.breakdown.entryGap;

      // Round label
      this.add.text(
        x - 40,
        y,
        `Round ${roundNumber}:`,
        {
          fontSize: layout.breakdown.labelSize,
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
          fontSize: layout.breakdown.scoreSize,
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: layout.breakdown.fontWeight
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