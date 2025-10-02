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

    // Responsive font sizes
    const fontSize = {
      header: isMobile ? '32px' : '48px',
      score: isMobile ? '22px' : '32px',
      nextRound: isMobile ? '16px' : '20px',
      button: isMobile ? '20px' : '24px',
      hint: isMobile ? '12px' : '14px'
    };

    // Responsive spacing
    let currentY = isMobile ? 40 : 100;

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
        strokeThickness: isMobile ? 2 : 4
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

    currentY += isMobile ? 60 : 100;

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

    currentY += isMobile ? 35 : 50;

    // Total score
    const totalText = this.add.text(
      centerX,
      currentY,
      `Total Score: ${progressManager.getTotalScore().toLocaleString()}`,
      {
        fontSize: fontSize.score,
        color: '#F59E0B', // Solar gold
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    totalText.setOrigin(0.5, 0.5);

    currentY += isMobile ? 50 : 90;

    // Progress indicator
    this.createProgressIndicator(centerX, currentY);

    // Account for 2 rows on both mobile and desktop (add extra space)
    currentY += isMobile ? 125 : 150;

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
        // Mobile: Stack buttons vertically at bottom
        const screenHeight = this.cameras.main.height;
        const buttonY = screenHeight - 120;

        // Visit Shop button (green)
        this.createButton(
          centerX,
          buttonY,
          'Visit Shop',
          () => this.scene.start('ShopScene'),
          0x10B981 // Spacey green
        );

        // Skip to Next Round button (cyan)
        this.createButton(
          centerX,
          buttonY + 60,
          'Skip to Next Round',
          () => this.scene.start('GameScene'),
          0x00F5FF // Cyan
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
      const shipSpacing = 65;
      const rowSpacing = 65;
      const shipScale = 0.6;
      const shipsPerRow = 5;

      for (let i = 1; i <= 10; i++) {
        const row = Math.floor((i - 1) / shipsPerRow);
        const col = (i - 1) % shipsPerRow;

        const x = centerX - (shipsPerRow - 1) * shipSpacing / 2 + col * shipSpacing;
        const shipY = y + row * rowSpacing;

        this.createShipIcon(i, x, shipY, currentRound, shipScale);
      }
    } else {
      // Desktop: 2 rows of 5 ships (same as mobile layout)
      const shipSpacing = 85;
      const rowSpacing = 80;
      const shipScale = 1.0;
      const shipsPerRow = 5;

      for (let i = 1; i <= 10; i++) {
        const row = Math.floor((i - 1) / shipsPerRow);
        const col = (i - 1) % shipsPerRow;

        const x = centerX - (shipsPerRow - 1) * shipSpacing / 2 + col * shipSpacing;
        const shipY = y + row * rowSpacing;

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
      y + (isMobile ? 30 : 45),
      roundNum.toString(),
      {
        fontSize: isMobile ? '12px' : '14px',
        color: roundNum <= currentRound ? '#00F5FF' : '#666666',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5);
  }

  private createButton(x: number, y: number, text: string, onClick: () => void, color: number = 0x00F5FF): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const btnWidth = isMobile ? 200 : 180;
    const btnHeight = isMobile ? 50 : 60;
    const btnFontSize = isMobile ? '18px' : '20px';

    const btn = this.add.rectangle(x, y, btnWidth, btnHeight, color);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(x, y, text, {
      fontSize: btnFontSize,
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    btnText.setOrigin(0.5, 0.5);

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