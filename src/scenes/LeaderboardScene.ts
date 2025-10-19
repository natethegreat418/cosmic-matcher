import * as Phaser from 'phaser';
import { LeaderboardService } from '../services/LeaderboardService';
import { GameProgressManager } from '../game/GameProgressManager';
import type { LeaderboardEntry, LeaderboardFilter } from '../types/Leaderboard';
import { getLeaderboardLayout, isMobile, getBottomSafeArea } from '../config/ResponsiveConfig';
import { UIButton } from '../ui/UIButton';
import { UIMobileShelf } from '../ui/UIMobileShelf';

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
    const screenWidth = this.cameras.main.width;
    const centerX = screenWidth / 2;
    const layout = getLeaderboardLayout();

    if (mobile) {
      const { bottomButtons } = layout;
      const bottomSafe = getBottomSafeArea();

      UIMobileShelf.create(this, {
        bottomSafeArea: bottomSafe,
        buttonHeight: bottomButtons.buttonHeight,
        buttonGap: bottomButtons.gap,
        buttons: [
          {
            text: 'Play Again',
            variant: 'primary',
            fontSize: bottomButtons.fontSize || '20px',
            onClick: () => {
              const progressManager = GameProgressManager.getInstance();
              progressManager.startNewGame();
              this.scene.start('GameScene');
            }
          },
          {
            text: 'Home',
            variant: 'secondary',
            fontSize: bottomButtons.fontSize || '20px',
            onClick: () => window.location.href = '/'
          }
        ]
      });
    } else {
      const { bottomButtons } = layout;

      // Play Again button
      UIButton.create(this, {
        x: centerX - bottomButtons.buttonWidth! / 2 - bottomButtons.gap / 2,
        y: bottomButtons.y,
        width: bottomButtons.buttonWidth!,
        height: bottomButtons.buttonHeight,
        text: 'Play Again',
        variant: 'primary',
        fontSize: bottomButtons.fontSize || '20px',
        onClick: () => {
          const progressManager = GameProgressManager.getInstance();
          progressManager.startNewGame();
          this.scene.start('GameScene');
        }
      });

      // Home button
      UIButton.create(this, {
        x: centerX + bottomButtons.buttonWidth! / 2 + bottomButtons.gap / 2,
        y: bottomButtons.y,
        width: bottomButtons.buttonWidth!,
        height: bottomButtons.buttonHeight,
        text: 'Home',
        variant: 'secondary',
        fontSize: bottomButtons.fontSize || '20px',
        onClick: () => window.location.href = '/'
      });
    }
  }
}
