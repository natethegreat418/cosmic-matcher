import * as Phaser from 'phaser';
import { LeaderboardService } from '../services/LeaderboardService';
import { GameProgressManager } from '../game/GameProgressManager';
import { GAME_CONFIG } from '../types';
import type { LeaderboardEntry, LeaderboardFilter } from '../types/Leaderboard';

/**
 * Scene for displaying the leaderboard
 */
export class LeaderboardScene extends Phaser.Scene {
  private leaderboardService!: LeaderboardService;
  private currentFilter: LeaderboardFilter = 'all-time';
  private entries: LeaderboardEntry[] = [];
  private entryContainer?: Phaser.GameObjects.Container;
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  preload(): void {
    this.leaderboardService = LeaderboardService.getInstance();
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const isMobile = GAME_CONFIG.IS_MOBILE;

    this.cameras.main.setBackgroundColor('#2a2a2a');

    let currentY = isMobile ? 20 : 40;

    // Title
    this.add.text(
      centerX,
      currentY,
      '🏆 LEADERBOARD 🏆',
      {
        fontSize: isMobile ? '32px' : '48px',
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: isMobile ? 2 : 3
      }
    ).setOrigin(0.5);

    currentY += isMobile ? 60 : 80;

    // Filter buttons
    this.createFilterButtons(centerX, currentY);

    currentY += isMobile ? 60 : 80;

    // Loading text
    this.loadingText = this.add.text(
      centerX,
      currentY + 100,
      'Loading...',
      {
        fontSize: isMobile ? '18px' : '20px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5);

    // Container for leaderboard entries
    this.entryContainer = this.add.container(0, currentY);

    // Back button
    this.createBackButton(isMobile);

    // Load initial data
    this.loadLeaderboard();
  }

  private createFilterButtons(centerX: number, y: number): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const filters: LeaderboardFilter[] = ['all-time', 'this-week', 'today'];
    const labels = ['All Time', 'This Week', 'Today'];
    const buttonWidth = isMobile ? 90 : 120;
    const gap = isMobile ? 8 : 16;
    const totalWidth = (buttonWidth * 3) + (gap * 2);
    const startX = centerX - totalWidth / 2 + buttonWidth / 2;

    filters.forEach((filter, index) => {
      const x = startX + (index * (buttonWidth + gap));
      const isActive = filter === this.currentFilter;

      const btn = this.add.rectangle(
        x,
        y,
        buttonWidth,
        isMobile ? 35 : 40,
        isActive ? 0x00F5FF : 0x444444
      );
      btn.setInteractive({ useHandCursor: true });

      this.add.text(
        x,
        y,
        labels[index],
        {
          fontSize: isMobile ? '12px' : '14px',
          color: isActive ? '#000000' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);

      btn.on('pointerdown', () => {
        this.currentFilter = filter;
        this.scene.restart();
      });

      btn.on('pointerover', () => {
        if (!isActive) {
          btn.setFillStyle(0x666666);
        }
      });

      btn.on('pointerout', () => {
        if (!isActive) {
          btn.setFillStyle(0x444444);
        }
      });
    });
  }

  private async loadLeaderboard(): Promise<void> {
    if (this.loadingText) {
      this.loadingText.setVisible(true);
    }

    this.entries = await this.leaderboardService.getTopScores(10, this.currentFilter);

    if (this.loadingText) {
      this.loadingText.setVisible(false);
    }

    this.displayEntries();
  }

  private displayEntries(): void {
    if (!this.entryContainer) return;

    // Clear previous entries
    this.entryContainer.removeAll(true);

    const isMobile = GAME_CONFIG.IS_MOBILE;
    const centerX = this.cameras.main.width / 2;

    if (this.entries.length === 0) {
      const noDataText = this.add.text(
        centerX,
        100,
        'No scores yet. Be the first!',
        {
          fontSize: isMobile ? '16px' : '18px',
          color: '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5);

      this.entryContainer.add(noDataText);
      return;
    }

    const entryHeight = isMobile ? 50 : 60;
    const entryGap = isMobile ? 8 : 12;

    this.entries.forEach((entry, index) => {
      const y = index * (entryHeight + entryGap);
      this.createEntryRow(entry, index + 1, centerX, y, entryHeight);
    });
  }

  private createEntryRow(entry: LeaderboardEntry, rank: number, centerX: number, y: number, height: number): void {
    if (!this.entryContainer) return;

    const isMobile = GAME_CONFIG.IS_MOBILE;
    const entryWidth = isMobile ? Math.min(this.cameras.main.width - 32, 380) : 700;

    // Background
    const bgColor = rank <= 3 ? 0x3a3a3a : 0x2a2a2a;
    const bg = this.add.rectangle(centerX, y + height / 2, entryWidth, height, bgColor);

    // Rank (with medal for top 3)
    let rankText = `${rank}`;
    let rankColor = '#ffffff';

    if (rank === 1) {
      rankText = '🥇';
    } else if (rank === 2) {
      rankText = '🥈';
    } else if (rank === 3) {
      rankText = '🥉';
    }

    const rankDisplay = this.add.text(
      centerX - entryWidth / 2 + (isMobile ? 25 : 40),
      y + height / 2,
      rankText,
      {
        fontSize: isMobile ? '18px' : '20px',
        color: rankColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Player name
    const name = this.add.text(
      centerX - entryWidth / 2 + (isMobile ? 65 : 100),
      y + height / 2,
      entry.playerName,
      {
        fontSize: isMobile ? '16px' : '18px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);

    // Score
    const score = this.add.text(
      centerX + entryWidth / 2 - (isMobile ? 15 : 20),
      y + height / 2,
      entry.totalScore.toLocaleString(),
      {
        fontSize: isMobile ? '16px' : '18px',
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0.5);

    // Completion indicator
    if (entry.gameCompleted) {
      const checkmark = this.add.text(
        centerX + entryWidth / 2 - (isMobile ? 90 : 120),
        y + height / 2,
        '✓',
        {
          fontSize: isMobile ? '16px' : '18px',
          color: '#10B981',
          fontFamily: 'Arial, sans-serif'
        }
      ).setOrigin(0.5);

      this.entryContainer.add(checkmark);
    }

    this.entryContainer.add([bg, rankDisplay, name, score]);
  }

  private createBackButton(isMobile: boolean): void {
    const screenHeight = this.cameras.main.height;
    const screenWidth = this.cameras.main.width;
    const centerX = screenWidth / 2;

    if (isMobile) {
      // Sticky bottom buttons on mobile
      const bottomSafeArea = 80; // Match other scenes
      const shelfHeight = 128; // Height for 2 buttons
      const btnHeight = 50;
      const gap = 8;

      // Create sticky shelf background
      const shelf = this.add.rectangle(
        centerX,
        screenHeight - shelfHeight / 2 - bottomSafeArea,
        screenWidth,
        shelfHeight,
        0x1a1a1a
      );
      shelf.setScrollFactor(0);
      shelf.setDepth(1000);

      // Add top border
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

      // Play Again button
      this.createButton(
        centerX,
        buttonY1,
        'Play Again',
        () => {
          const progressManager = GameProgressManager.getInstance();
          progressManager.startNewGame();
          this.scene.start('GameScene');
        },
        0x00F5FF, // Cyan
        screenWidth - 32,
        btnHeight,
        true
      );

      // Home button (light yellow)
      this.createButton(
        centerX,
        buttonY2,
        'Home',
        () => window.location.href = '/',
        0xFBBF24, // Light yellow
        screenWidth - 32,
        btnHeight,
        true
      );
    } else {
      // Desktop: Two buttons side by side
      const buttonY = screenHeight - 60;
      const buttonSpacing = 120;

      // Play Again button
      this.createButton(
        centerX - buttonSpacing,
        buttonY,
        'Play Again',
        () => {
          const progressManager = GameProgressManager.getInstance();
          progressManager.startNewGame();
          this.scene.start('GameScene');
        },
        0x00F5FF, // Cyan
        200,
        50,
        false
      );

      // Home button (light yellow)
      this.createButton(
        centerX + buttonSpacing,
        buttonY,
        'Home',
        () => window.location.href = '/',
        0xFBBF24, // Light yellow
        200,
        50,
        false
      );
    }
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    color: number,
    width: number,
    height: number,
    sticky: boolean
  ): void {
    const btn = this.add.rectangle(x, y, width, height, color);
    btn.setInteractive({ useHandCursor: true });
    if (sticky) {
      btn.setScrollFactor(0);
      btn.setDepth(1001);
    }

    const btnText = this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    btnText.setOrigin(0.5);
    if (sticky) {
      btnText.setScrollFactor(0);
      btnText.setDepth(1002);
    }

    // Hover colors
    let hoverColor: number;
    if (color === 0xFBBF24) hoverColor = 0xFDE68A; // Light yellow
    else hoverColor = 0x00FFFF; // Cyan

    btn.on('pointerover', () => {
      btn.setFillStyle(hoverColor);
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(color);
    });

    btn.on('pointerdown', onClick);
  }
}
