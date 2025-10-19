import * as Phaser from 'phaser';
import { LeaderboardService } from '../services/LeaderboardService';
import { GameProgressManager } from '../game/GameProgressManager';
import type { LeaderboardEntry, LeaderboardFilter } from '../types/Leaderboard';
import { getLeaderboardLayout, isMobile } from '../config/ResponsiveConfig';

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
    const mobile = isMobile();
    const layout = getLeaderboardLayout();

    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Title
    this.add.text(
      centerX,
      layout.header.y,
      '🏆 LEADERBOARD 🏆',
      {
        fontSize: layout.header.fontSize,
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: mobile ? 2 : 3
      }
    ).setOrigin(0.5);

    // Filter buttons
    this.createFilterButtons(centerX, layout.tabs.y);

    // Loading text
    this.loadingText = this.add.text(
      centerX,
      layout.entries.startY + 100,
      'Loading...',
      {
        fontSize: mobile ? '18px' : '20px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5);

    // Container for leaderboard entries
    this.entryContainer = this.add.container(0, layout.entries.startY);

    // Back button
    this.createBackButton(mobile);

    // Load initial data
    this.loadLeaderboard();
  }

  private createFilterButtons(centerX: number, y: number): void {
    const mobile = isMobile();
    const layout = getLeaderboardLayout();
    const filters: LeaderboardFilter[] = ['all-time', 'this-week', 'today'];
    const labels = ['All Time', 'This Week', 'Today'];

    const buttonWidth = mobile ? 90 : (layout.tabs.buttonWidth || 120);
    const buttonHeight = layout.tabs.buttonHeight;
    const gap = layout.tabs.gap;
    const totalWidth = (buttonWidth * 3) + (gap * 2);
    const startX = centerX - totalWidth / 2 + buttonWidth / 2;

    filters.forEach((filter, index) => {
      const x = startX + (index * (buttonWidth + gap));
      const isActive = filter === this.currentFilter;

      const btn = this.add.rectangle(
        x,
        y,
        buttonWidth,
        buttonHeight,
        isActive ? 0x00F5FF : 0x333333
      );
      btn.setInteractive({ useHandCursor: true });

      this.add.text(
        x,
        y,
        labels[index],
        {
          fontSize: layout.tabs.fontSize,
          color: isActive ? '#000000' : '#00F5FF',
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
          btn.setFillStyle(0x444444);
        }
      });

      btn.on('pointerout', () => {
        if (!isActive) {
          btn.setFillStyle(0x333333);
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

    const mobile = isMobile();
    const layout = getLeaderboardLayout();
    const centerX = this.cameras.main.width / 2;

    if (this.entries.length === 0) {
      const noDataText = this.add.text(
        centerX,
        100,
        'No scores yet. Be the first!',
        {
          fontSize: mobile ? '16px' : '18px',
          color: '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5);

      this.entryContainer.add(noDataText);
      return;
    }

    const entryHeight = layout.entries.entryHeight;
    const entryGap = mobile ? 8 : 12;

    this.entries.slice(0, layout.entries.maxVisible).forEach((entry, index) => {
      const y = index * (entryHeight + entryGap);
      this.createEntryRow(entry, index + 1, centerX, y, entryHeight);
    });
  }

  private createEntryRow(entry: LeaderboardEntry, rank: number, centerX: number, y: number, height: number): void {
    if (!this.entryContainer) return;

    const mobile = isMobile();
    const layout = getLeaderboardLayout();
    const entryWidth = mobile ? Math.min(this.cameras.main.width - 32, 380) : (layout.entries.width || 700);

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
      centerX - entryWidth / 2 + layout.entries.paddingHorizontal + (layout.entries.medalSize / 2),
      y + height / 2,
      rankText,
      {
        fontSize: `${layout.entries.medalSize}px`,
        color: rankColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Player name
    const name = this.add.text(
      centerX - entryWidth / 2 + layout.entries.paddingHorizontal + layout.entries.medalSize + 20,
      y + height / 2,
      entry.playerName,
      {
        fontSize: layout.entries.nameFontSize,
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: layout.entries.nameFontWeight
      }
    ).setOrigin(0, 0.5);

    // Score
    const score = this.add.text(
      centerX + entryWidth / 2 - layout.entries.paddingHorizontal,
      y + height / 2,
      entry.totalScore.toLocaleString(),
      {
        fontSize: layout.entries.scoreFontSize,
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: layout.entries.scoreFontWeight
      }
    ).setOrigin(1, 0.5);

    // Completion indicator
    if (entry.gameCompleted) {
      const checkmark = this.add.text(
        centerX + entryWidth / 2 - layout.entries.paddingHorizontal - parseInt(layout.entries.scoreFontSize) * 4,
        y + height / 2,
        '✓',
        {
          fontSize: layout.entries.nameFontSize,
          color: '#10B981',
          fontFamily: 'Arial, sans-serif'
        }
      ).setOrigin(0.5);

      this.entryContainer.add(checkmark);
    }

    this.entryContainer.add([bg, rankDisplay, name, score]);
  }

  private createBackButton(mobile: boolean): void {
    const screenHeight = this.cameras.main.height;
    const screenWidth = this.cameras.main.width;
    const centerX = screenWidth / 2;
    const layout = getLeaderboardLayout();

    if (mobile) {
      const { bottomButtons } = layout;
      const bottomSafe = screenHeight - bottomButtons.y; // Distance from buttonY to bottom
      const shelfHeight = bottomButtons.buttonHeight * 2 + bottomButtons.gap + 32;
      const shelfY = screenHeight - shelfHeight / 2 - bottomSafe;

      // Create sticky shelf background
      const shelf = this.add.rectangle(
        centerX,
        shelfY,
        screenWidth,
        shelfHeight,
        0x1a1a1a
      );
      shelf.setScrollFactor(0);
      shelf.setDepth(1000);

      // Add top border
      const border = this.add.rectangle(
        centerX,
        shelfY - shelfHeight / 2,
        screenWidth,
        1,
        0x4a4a4a
      );
      border.setScrollFactor(0);
      border.setDepth(1000);

      const topPadding = 16;
      const buttonY1 = shelfY - shelfHeight / 2 + topPadding + bottomButtons.buttonHeight / 2;
      const buttonY2 = buttonY1 + bottomButtons.buttonHeight + bottomButtons.gap;

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
        0x00F5FF,
        screenWidth - 32,
        bottomButtons.buttonHeight,
        true
      );

      // Home button
      this.createButton(
        centerX,
        buttonY2,
        'Home',
        () => window.location.href = '/',
        0xF59E0B,
        screenWidth - 32,
        bottomButtons.buttonHeight,
        true
      );
    } else {
      const { bottomButtons } = layout;

      // Play Again button
      this.createButton(
        centerX - bottomButtons.buttonWidth! / 2 - bottomButtons.gap / 2,
        bottomButtons.y,
        'Play Again',
        () => {
          const progressManager = GameProgressManager.getInstance();
          progressManager.startNewGame();
          this.scene.start('GameScene');
        },
        0x00F5FF,
        bottomButtons.buttonWidth!,
        bottomButtons.buttonHeight,
        false
      );

      // Home button
      this.createButton(
        centerX + bottomButtons.buttonWidth! / 2 + bottomButtons.gap / 2,
        bottomButtons.y,
        'Home',
        () => window.location.href = '/',
        0xF59E0B,
        bottomButtons.buttonWidth!,
        bottomButtons.buttonHeight,
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

    const layout = getLeaderboardLayout();
    const btnText = this.add.text(x, y, text, {
      fontSize: layout.bottomButtons.fontSize || '20px',
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
    if (color === 0x00F5FF) hoverColor = 0x66FFFF; // Primary hover: Lighter Bright Cyan
    else if (color === 0xF59E0B) hoverColor = 0xFFBF40; // Secondary hover: Lighter Solar Gold
    else hoverColor = 0x66FFFF; // Default to primary hover

    btn.on('pointerover', () => {
      btn.setFillStyle(hoverColor);
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(color);
    });

    btn.on('pointerdown', onClick);
  }
}
