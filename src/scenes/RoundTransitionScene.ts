import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { GAME_CONFIG } from '../types';
import type { RoundResult } from '../types/Progress';

export class RoundTransitionScene extends Phaser.Scene {
  private roundResult?: RoundResult;

  constructor() {
    super({ key: 'RoundTransitionScene' });
  }

  init(data: { roundResult: RoundResult }): void {
    this.roundResult = data.roundResult;
  }

  preload(): void {
    // Load ship SVGs for progress indicator
    this.load.svg('ship-normal', '/ships/normal.svg', { width: 60, height: 60 });
    this.load.svg('ship-medium', '/ships/medium.svg', { width: 60, height: 60 });
    this.load.svg('ship-fast', '/ships/fast.svg', { width: 60, height: 60 });
    this.load.svg('ship-ludicrous', '/ships/ludicrous.svg', { width: 60, height: 60 });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const progressManager = GameProgressManager.getInstance();
    const isMobile = GAME_CONFIG.IS_MOBILE;

    // Auto-save after round completion
    LocalStorageManager.saveGame();

    // Background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Abandon Ship button (top right)
    this.createAbandonButton();

    // Responsive font sizes per design spec
    const fontSize = {
      header: isMobile ? '36px' : '60px', // Smaller header on mobile to fit
      score: isMobile ? '24px' : '30px', // Round score: text-2xl / text-3xl
      totalScore: isMobile ? '30px' : '36px', // Total score: text-3xl / text-4xl
      nextRound: isMobile ? '20px' : '24px', // text-xl / text-2xl
      button: isMobile ? '20px' : '20px', // text-xl
      hint: isMobile ? '12px' : '14px'
    };

    // Responsive spacing
    let currentY = isMobile ? 30 : 60; // More top spacing on mobile

    // Round complete header
    const headerText = this.add.text(
      centerX,
      currentY,
      `Round ${this.roundResult!.roundNumber} Complete!`,
      {
        fontSize: fontSize.header,
        color: '#00F5FF', // Bright cyan
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: isMobile ? 1 : 4
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

    currentY += isMobile ? 35 : 100;

    // Round score
    this.add.text(
      centerX,
      currentY,
      `Round Score: ${this.roundResult!.score.toLocaleString()}`,
      {
        fontSize: fontSize.score,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    currentY += isMobile ? 30 : 50;

    // Total score (larger font per spec)
    const totalText = this.add.text(
      centerX,
      currentY,
      `Total Score: ${progressManager.getTotalScore().toLocaleString()}`,
      {
        fontSize: fontSize.totalScore,
        color: '#F59E0B', // Solar gold
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    totalText.setOrigin(0.5, 0.5);

    currentY += isMobile ? 35 : 90;

    // Progress indicator
    this.createProgressIndicator(centerX, currentY);

    // Account for 2 rows on both mobile and desktop (add extra space)
    // Desktop needs more space: (64px ship × 2 rows) + (24px gap) + (20px text height) + margin
    currentY += isMobile ? 125 : 200;

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
        currentY,
        `Next: Round ${nextRound}${speedWarning}`,
        {
          fontSize: fontSize.nextRound,
          color: speedMultiplier > 2 ? '#EC4899' : '#ffffff', // Pink for high speed
          fontFamily: 'Arial, sans-serif',
          fontStyle: speedMultiplier > 1 ? 'italic' : 'normal'
        }
      ).setOrigin(0.5, 0.5);

      currentY += isMobile ? 45 : 80;

      // Buttons positioned at bottom on mobile, inline on desktop
      if (isMobile) {
        // Mobile: Stack buttons vertically in sticky bottom shelf (matches shop style)
        const screenHeight = this.cameras.main.height;
        const screenWidth = this.cameras.main.width;
        const btnPaddingY = 16; // py-4 on mobile
        const btnHeight = btnPaddingY * 2 + 24; // Same as shop: 56px
        const bottomSafeArea = 80; // Extra space for Safari bottom UI
        const shelfHeight = 148; // Enough for 2 buttons + padding + gap (56+8+56+16+12)

        // Create sticky shelf background (matches shop)
        const shelf = this.add.rectangle(
          centerX,
          screenHeight - shelfHeight / 2 - bottomSafeArea,
          screenWidth,
          shelfHeight,
          0x1a1a1a
        );
        shelf.setScrollFactor(0);
        shelf.setDepth(1000);

        // Add top border (matches shop)
        const border = this.add.rectangle(
          centerX,
          screenHeight - shelfHeight - bottomSafeArea,
          screenWidth,
          1,
          0x4a4a4a
        );
        border.setScrollFactor(0);
        border.setDepth(1000);

        // Button positioning - center buttons in shelf with padding
        const topPadding = 16;
        const gap = 8;
        const buttonY1 = screenHeight - shelfHeight + topPadding + btnHeight / 2 - bottomSafeArea;
        const buttonY2 = buttonY1 + btnHeight + gap;

        // Visit Shop button (green) - full width
        this.createButton(
          centerX,
          buttonY1,
          'Visit Shop',
          () => this.scene.start('ShopScene'),
          0x10B981, // Spacey green
          true // sticky
        );

        // Skip to Next Round button (cyan) - full width
        this.createButton(
          centerX,
          buttonY2,
          'Skip to Next Round',
          () => this.scene.start('GameScene'),
          0x00F5FF, // Cyan
          true // sticky
        );
      } else {
        // Desktop: Two buttons side by side
        const buttonSpacing = 120;

        // Visit Shop button (green)
        this.createButton(
          centerX - buttonSpacing,
          currentY,
          'Visit Shop',
          () => this.scene.start('ShopScene'),
          0x10B981 // Spacey green
        );

        // Skip to Next Round button (cyan)
        this.createButton(
          centerX + buttonSpacing,
          currentY,
          'Skip Shop',
          () => this.scene.start('GameScene'),
          0x00F5FF // Cyan
        );
      }
    } else {
      // Game complete - single button to view results
      currentY += isMobile ? 45 : 80;

      const continueBtn = this.add.rectangle(
        centerX,
        currentY,
        isMobile ? 180 : 200,
        isMobile ? 50 : 60,
        0x00F5FF
      );
      continueBtn.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(
        centerX,
        currentY,
        'View Results',
        {
          fontSize: fontSize.button,
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );
      btnText.setOrigin(0.5, 0.5);

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
        this.scene.start('GameOverScene');
      });
    }
  }

  private createProgressIndicator(centerX: number, y: number): void {
    const currentRound = this.roundResult!.roundNumber;
    const isMobile = GAME_CONFIG.IS_MOBILE;

    if (isMobile) {
      // Mobile: 2 rows of 5 ships (vertical stacking)
      const shipSize = 48; // w-12 h-12
      const gap = 16; // gap-4
      const shipScale = shipSize / 60; // 60 is default ship size
      const shipsPerRow = 5;

      // Total width includes ship sizes + gaps between them
      const totalWidth = (shipSize * shipsPerRow) + (gap * (shipsPerRow - 1));
      const startX = centerX - totalWidth / 2;

      for (let i = 1; i <= 10; i++) {
        const row = Math.floor((i - 1) / shipsPerRow);
        const col = (i - 1) % shipsPerRow;

        const x = startX + (shipSize / 2) + col * (shipSize + gap);
        const shipY = y + row * (shipSize + gap);

        this.createShipIcon(i, x, shipY, currentRound, shipScale);
      }
    } else {
      // Desktop: 2 rows of 5 ships (same as mobile layout)
      const shipSize = 64; // w-16 h-16
      const gap = 24; // gap-6
      const shipScale = shipSize / 60; // 60 is default ship size
      const shipsPerRow = 5;

      // Total width includes ship sizes + gaps between them
      const totalWidth = (shipSize * shipsPerRow) + (gap * (shipsPerRow - 1));
      const startX = centerX - totalWidth / 2;

      for (let i = 1; i <= 10; i++) {
        const row = Math.floor((i - 1) / shipsPerRow);
        const col = (i - 1) % shipsPerRow;

        const x = startX + (shipSize / 2) + col * (shipSize + gap);
        const shipY = y + row * (shipSize + gap);

        this.createShipIcon(i, x, shipY, currentRound, shipScale);
      }
    }
  }

  private createShipIcon(roundNum: number, x: number, y: number, currentRound: number, scale: number): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;

    // Determine ship type based on round speed
    let shipType: string;
    if (roundNum <= 2) {
      shipType = 'ship-normal'; // Rounds 1-2: 1x speed
    } else if (roundNum <= 4) {
      shipType = 'ship-medium'; // Rounds 3-4: 1.5x speed
    } else if (roundNum <= 6) {
      shipType = 'ship-fast'; // Rounds 5-6: 2x speed
    } else if (roundNum <= 8) {
      shipType = 'ship-fast'; // Rounds 7-8: 2.5x speed (using fast ship)
    } else {
      shipType = 'ship-ludicrous'; // Rounds 9-10: 3x speed
    }

    // Create ship sprite
    const ship = this.add.image(x, y, shipType);
    ship.setScale(scale);

    // Apply tint based on completion status
    if (roundNum < currentRound) {
      ship.setTint(0xFFFFFF); // Completed - white glow (no animation)
    } else if (roundNum === currentRound + 1 && currentRound < 10) {
      ship.setTint(0xFFFFFF); // Next round - white glow with animation

      // Animate next round ship (the one you're entering)
      this.tweens.add({
        targets: ship,
        scale: { from: scale, to: scale * 1.3 },
        duration: 500,
        ease: 'Power2',
        yoyo: true,
        repeat: -1
      });
    } else if (roundNum === currentRound) {
      ship.setTint(0xFFFFFF); // Just completed - white glow (no animation)
    } else {
      ship.setTint(0x666666); // Not reached - medium gray
      ship.setAlpha(0.5);
    }

    // Add small round number below ship
    this.add.text(
      x,
      y + (isMobile ? 30 : 40),
      roundNum.toString(),
      {
        fontSize: isMobile ? '18px' : '20px', // text-lg / text-xl per spec
        color: roundNum <= currentRound ? '#00F5FF' : '#666666',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5);
  }

  private createAbandonButton(): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const screenWidth = this.cameras.main.width;

    // Position in top right corner
    const buttonX = screenWidth - (isMobile ? 90 : 110);
    const buttonY = isMobile ? 20 : 30;
    const buttonWidth = isMobile ? 105 : 120;
    const buttonHeight = isMobile ? 35 : 40;

    // Button background (dark red)
    const btn = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x8B0000);
    btn.setInteractive({ useHandCursor: true });

    // Text and skull icon (skull after text)
    const btnText = this.add.text(
      buttonX,
      buttonY,
      'Abandon 💀',
      {
        fontSize: isMobile ? '13px' : '14px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    btnText.setOrigin(0.5);

    // Hover effects
    btn.on('pointerover', () => {
      btn.setFillStyle(0xDC143C); // Brighter red
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
      btn.setFillStyle(0x8B0000);
      btn.setScale(1);
    });

    btn.on('pointerdown', () => {
      this.abandonGame();
    });
  }

  private abandonGame(): void {
    // Mark game as complete and end it
    const progressManager = GameProgressManager.getInstance();
    const progress = progressManager.getProgress();

    // Mark as complete (but not truly complete - abandoned)
    progress.isComplete = true;

    // Clear save since we're ending the game
    LocalStorageManager.clearSave();

    // Go to game over scene
    this.scene.start('GameOverScene');
  }

  private createButton(x: number, y: number, text: string, onClick: () => void, color: number = 0x00F5FF, sticky: boolean = false): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const screenWidth = this.cameras.main.width;
    const btnWidth = (isMobile && sticky) ? screenWidth - 32 : 200; // Full width - padding on mobile sticky
    const btnHeight = 56; // h-14 (56px) per spec
    const btnFontSize = '20px'; // text-xl per spec

    const btn = this.add.rectangle(x, y, btnWidth, btnHeight, color);
    btn.setInteractive({ useHandCursor: true });
    if (sticky) {
      btn.setScrollFactor(0);
      btn.setDepth(1001);
    }

    const btnText = this.add.text(x, y, text, {
      fontSize: btnFontSize,
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    btnText.setOrigin(0.5, 0.5);
    if (sticky) {
      btnText.setScrollFactor(0);
      btnText.setDepth(1002);
    }

    // Define hover colors based on button color
    let hoverColor: number;
    if (color === 0x00F5FF) {
      // Cyan button - much brighter white hover
      hoverColor = 0xFFFFFF;
    } else if (color === 0x10B981) {
      // Green button - lighter green hover
      hoverColor = 0x14D89A;
    } else {
      // Default: slightly lighter
      hoverColor = Math.min(color + 0x303030, 0xFFFFFF);
    }

    // Button hover effect
    btn.on('pointerover', () => {
      btn.setFillStyle(hoverColor);
      this.tweens.add({
        targets: btn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(color);
      btn.setScale(1);
    });

    btn.on('pointerdown', onClick);
  }
}