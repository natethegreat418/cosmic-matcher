import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { GAME_CONFIG } from '../types';
import type { RoundResult } from '../types/Progress';
import { getRoundTransitionLayout, isMobile, getBottomSafeArea } from '../config/ResponsiveConfig';
import { UIButton } from '../ui/UIButton';
import { UIMobileShelf } from '../ui/UIMobileShelf';

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
        const bottomSafe = getBottomSafeArea();

        UIMobileShelf.create(this, {
          bottomSafeArea: bottomSafe,
          buttonHeight: layout.buttons.buttonHeight,
          buttonGap: layout.buttons.gap,
          buttons: [
            {
              text: 'Visit Shop',
              variant: 'secondary',
              fontSize: '20px',
              onClick: () => this.scene.start('ShopScene')
            },
            {
              text: 'Skip to Next Round',
              variant: 'primary',
              fontSize: '20px',
              onClick: () => this.scene.start('GameScene')
            }
          ]
        });
      } else {
        // Desktop: Two buttons side by side
        const halfGap = layout.buttons.gap / 2;
        const btnWidth = layout.buttons.buttonWidth || 200;
        const btnY = layout.buttons.y || 400;

        // Visit Shop button (Secondary action)
        UIButton.create(this, {
          x: centerX - (btnWidth + halfGap) / 2,
          y: btnY,
          width: 200,
          height: 56,
          text: 'Visit Shop',
          variant: 'secondary',
          fontSize: '20px',
          onClick: () => this.scene.start('ShopScene')
        });

        // Skip to Next Round button (Primary action)
        UIButton.create(this, {
          x: centerX + (btnWidth + halfGap) / 2,
          y: btnY,
          width: 200,
          height: 56,
          text: 'Skip Shop',
          variant: 'primary',
          fontSize: '20px',
          onClick: () => this.scene.start('GameScene')
        });
      }
    } else {
      // Game complete - single button to view results
      const btnWidth = mobile ? 180 : 200;
      const btnHeight = mobile ? 50 : 60;
      const buttonY = mobile ? (layout.buttons.startY || 400) : (layout.buttons.y || 400);

      UIButton.create(this, {
        x: centerX,
        y: buttonY,
        width: btnWidth,
        height: btnHeight,
        text: 'View Results',
        variant: 'primary',
        fontSize: layout.buttons.fontSize || '20px',
        onClick: () => this.scene.start('GameOverScene')
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
}