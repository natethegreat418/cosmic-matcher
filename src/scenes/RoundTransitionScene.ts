import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { GAME_CONFIG } from '../types';
import type { RoundResult } from '../types/Progress';
import { getRoundTransitionLayout, isMobile } from '../config/ResponsiveConfig';

export class RoundTransitionScene extends Phaser.Scene {
  private roundResult?: RoundResult;

  constructor() {
    super({ key: 'RoundTransitionScene' });
  }

  init(data: { roundResult: RoundResult }): void {
    this.roundResult = data.roundResult;
  }

  preload(): void {
    // Load ship SVGs for progress indicator - size determined by layout
    const layout = getRoundTransitionLayout();
    const iconSize = layout.rockets.iconSize;

    this.load.svg('ship-normal', '/ships/normal.svg', { width: iconSize, height: iconSize });
    this.load.svg('ship-medium', '/ships/medium.svg', { width: iconSize, height: iconSize });
    this.load.svg('ship-fast', '/ships/fast.svg', { width: iconSize, height: iconSize });
    this.load.svg('ship-ludicrous', '/ships/ludicrous.svg', { width: iconSize, height: iconSize });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const progressManager = GameProgressManager.getInstance();
    const mobile = isMobile();
    const layout = getRoundTransitionLayout();

    LocalStorageManager.saveGame();
    this.cameras.main.setBackgroundColor('#2a2a2a');
    this.createAbandonButton();

    // Round complete header
    const headerText = this.add.text(
      centerX,
      layout.title.y,
      `Round ${this.roundResult!.roundNumber} Complete!`,
      {
        fontSize: layout.title.fontSize,
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: layout.title.fontWeight,
        stroke: '#000000',
        strokeThickness: mobile ? 1 : 4
      }
    );
    headerText.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: headerText,
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Round score
    this.add.text(
      centerX,
      layout.roundScore.y,
      `Round Score: ${this.roundResult!.score.toLocaleString()}`,
      {
        fontSize: layout.roundScore.fontSize,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    // Total score
    this.add.text(
      centerX,
      layout.totalScore.y,
      `Total Score: ${progressManager.getTotalScore().toLocaleString()}`,
      {
        fontSize: layout.totalScore.fontSize,
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: layout.totalScore.fontWeight
      }
    ).setOrigin(0.5, 0.5);

    // Progress indicator with larger rockets
    this.createProgressIndicator(centerX, layout.rockets.startY);

    // Next round preview
    const nextRound = progressManager.getCurrentRound();
    if (nextRound <= 10) {
      const speedMultiplier = progressManager.getTimerSpeedMultiplier();
      let speedWarning = '';

      if (speedMultiplier > 1) {
        speedWarning = ` (${speedMultiplier}x Speed!)`;
      }

      this.add.text(
        centerX,
        layout.nextRound.y,
        `Next: Round ${nextRound}${speedWarning}`,
        {
          fontSize: layout.nextRound.fontSize,
          color: speedMultiplier > 2 ? '#EC4899' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: speedMultiplier > 1 ? 'italic' : 'normal'
        }
      ).setOrigin(0.5, 0.5);

      // Buttons positioned using layout config
      if (mobile) {
        // Mobile: Stack buttons vertically in sticky bottom shelf
        const screenHeight = this.cameras.main.height;
        const screenWidth = this.cameras.main.width;
        const btnHeight = layout.buttons.buttonHeight;
        const bottomSafe = screenHeight - (layout.buttons.startY || 0);
        const shelfHeight = btnHeight * 2 + layout.buttons.gap + 32;

        // Create sticky shelf background
        const shelf = this.add.rectangle(
          centerX,
          screenHeight - shelfHeight / 2 - bottomSafe + btnHeight,
          screenWidth,
          shelfHeight,
          0x1a1a1a
        );
        shelf.setScrollFactor(0);
        shelf.setDepth(1000);

        // Add top border
        const border = this.add.rectangle(
          centerX,
          screenHeight - shelfHeight - bottomSafe + btnHeight,
          screenWidth,
          1,
          0x4a4a4a
        );
        border.setScrollFactor(0);
        border.setDepth(1000);

        // Button positioning
        const buttonY1 = layout.buttons.startY || 0;
        const buttonY2 = buttonY1 + btnHeight + layout.buttons.gap;

        // Visit Shop button (Secondary action)
        this.createButton(
          centerX,
          buttonY1,
          'Visit Shop',
          () => this.scene.start('ShopScene'),
          0xF59E0B,
          true
        );

        // Skip to Next Round button (Primary action)
        this.createButton(
          centerX,
          buttonY2,
          'Skip to Next Round',
          () => this.scene.start('GameScene'),
          0x00F5FF,
          true
        );
      } else {
        // Desktop: Two buttons side by side
        const halfGap = layout.buttons.gap / 2;
        const btnWidth = layout.buttons.buttonWidth || 200;
        const btnY = layout.buttons.y || 400;

        // Visit Shop button (Secondary action)
        this.createButton(
          centerX - (btnWidth + halfGap) / 2,
          btnY,
          'Visit Shop',
          () => this.scene.start('ShopScene'),
          0xF59E0B
        );

        // Skip to Next Round button (Primary action)
        this.createButton(
          centerX + (btnWidth + halfGap) / 2,
          btnY,
          'Skip Shop',
          () => this.scene.start('GameScene'),
          0x00F5FF
        );
      }
    } else {
      // Game complete - single button to view results
      const btnWidth = mobile ? 180 : 200;
      const btnHeight = mobile ? 50 : 60;
      const buttonY = mobile ? (layout.buttons.startY || 400) : (layout.buttons.y || 400);

      const continueBtn = this.add.rectangle(
        centerX,
        buttonY,
        btnWidth,
        btnHeight,
        0x00F5FF
      );
      continueBtn.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(
        centerX,
        buttonY,
        'View Results',
        {
          fontSize: layout.buttons.fontSize || '20px',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );
      btnText.setOrigin(0.5, 0.5);

      continueBtn.on('pointerover', () => {
        continueBtn.setFillStyle(0x66FFFF); // Primary hover: Lighter Bright Cyan
        this.tweens.add({
          targets: continueBtn,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
      });

      continueBtn.on('pointerout', () => {
        continueBtn.setFillStyle(0x00F5FF); // Primary: Bright Cyan
        continueBtn.setScale(1);
      });

      continueBtn.on('pointerdown', () => {
        this.scene.start('GameOverScene');
      });
    }
  }

  private createProgressIndicator(centerX: number, y: number): void {
    const currentRound = this.roundResult!.roundNumber;
    const mobile = isMobile();
    const layout = getRoundTransitionLayout();
    const { rockets } = layout;

    const shipSize = rockets.iconSize;
    const gap = rockets.gap;
    const rowGap = mobile ? gap : (rockets.rowGap || gap);
    const shipsPerRow = 5;

    const totalWidth = (shipSize * shipsPerRow) + (gap * (shipsPerRow - 1));
    const startX = centerX - totalWidth / 2;

    for (let i = 1; i <= 10; i++) {
      const row = Math.floor((i - 1) / shipsPerRow);
      const col = (i - 1) % shipsPerRow;

      const x = startX + (shipSize / 2) + col * (shipSize + gap);
      const shipY = y + row * (shipSize + rowGap);

      this.createShipIcon(i, x, shipY, currentRound);
    }
  }

  private createShipIcon(roundNum: number, x: number, y: number, currentRound: number): void {
    const baseScale = 1.0; // Ships are loaded at correct size

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
    ship.setScale(baseScale);

    // Apply tint based on completion status
    if (roundNum < currentRound) {
      ship.setTint(0xFFFFFF); // Completed - white glow (no animation)
    } else if (roundNum === currentRound + 1 && currentRound < 10) {
      ship.setTint(0xFFFFFF); // Next round - white glow with animation

      // Animate next round ship (the one you're entering)
      this.tweens.add({
        targets: ship,
        scale: { from: baseScale, to: baseScale * 1.3 },
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
    const layout = getRoundTransitionLayout();
    const numberOffset = layout.rockets.numberOffset;

    this.add.text(
      x,
      y + numberOffset,
      roundNum.toString(),
      {
        fontSize: layout.rockets.numberSize,
        color: roundNum <= currentRound ? '#00F5FF' : '#666666',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0);
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
      // Primary hover: Lighter Bright Cyan
      hoverColor = 0x66FFFF;
    } else if (color === 0xF59E0B) {
      // Secondary hover: Lighter Solar Gold
      hoverColor = 0xFFBF40;
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