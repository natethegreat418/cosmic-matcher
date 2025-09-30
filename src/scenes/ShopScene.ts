import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { ShopSystem } from '../game/ShopSystem';
import { GAME_CONFIG } from '../types';
import type { ShopItem } from '../types/Progress';

export class ShopScene extends Phaser.Scene {
  private shopSystem!: ShopSystem;
  private progressManager!: GameProgressManager;
  private pointsText?: Phaser.GameObjects.Text;
  private messageText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    this.shopSystem = ShopSystem.getInstance();
    this.progressManager = GameProgressManager.getInstance();

    const centerX = this.cameras.main.width / 2;
    const isMobile = GAME_CONFIG.IS_MOBILE;

    // Background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Responsive font sizes
    const fontSize = {
      header: isMobile ? '28px' : '42px',
      score: isMobile ? '20px' : '28px',
      instructions: isMobile ? '13px' : '16px',
      warning: isMobile ? '12px' : '14px',
      message: isMobile ? '14px' : '18px',
      button: isMobile ? '18px' : '24px',
      hint: isMobile ? '11px' : '14px'
    };

    let currentY = isMobile ? 30 : 80;

    // Shop header
    const headerText = this.add.text(
      centerX,
      currentY,
      '⭐ COSMIC SHOP ⭐',
      {
        fontSize: fontSize.header,
        color: '#F59E0B', // Solar gold
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: isMobile ? 2 : 3
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

    currentY += isMobile ? 40 : 60;

    // Current score display
    this.pointsText = this.add.text(
      centerX,
      currentY,
      `Total Score: ${this.progressManager.getTotalScore().toLocaleString()}`,
      {
        fontSize: fontSize.score,
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    this.pointsText.setOrigin(0.5, 0.5);

    currentY += isMobile ? 30 : 40;

    // Instructions
    const instructionText = this.add.text(
      centerX,
      currentY,
      isMobile ? 'Spend your score for upgrades' : 'Spend your score for upgrades that help in future rounds',
      {
        fontSize: fontSize.instructions,
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif'
      }
    );
    instructionText.setOrigin(0.5, 0.5);

    currentY += isMobile ? 18 : 20;

    // Warning about spending
    const warningText = this.add.text(
      centerX,
      currentY,
      isMobile ? 'Purchases reduce your total score!' : 'Each purchase permanently reduces your total score!',
      {
        fontSize: fontSize.warning,
        color: '#FF6B6B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );
    warningText.setOrigin(0.5, 0.5);

    currentY += isMobile ? 35 : 60;

    // Display shop items
    const itemsStartY = currentY;
    this.displayShopItems(centerX, itemsStartY);

    // Calculate position for message based on number of items
    const availableItems = this.shopSystem.getAvailableItems();
    const itemHeight = isMobile ? 65 : 80;
    currentY = itemsStartY + (availableItems.length > 0 ? availableItems.length * itemHeight + 20 : 70);

    // Message area for feedback
    this.messageText = this.add.text(
      centerX,
      currentY,
      '',
      {
        fontSize: fontSize.message,
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );
    this.messageText.setOrigin(0.5, 0.5);

    currentY += isMobile ? 40 : 100;

    // Continue button
    this.createContinueButton(centerX, currentY);
  }

  private displayShopItems(centerX: number, startY: number): void {
    const availableItems = this.shopSystem.getAvailableItems();
    const isMobile = GAME_CONFIG.IS_MOBILE;

    if (availableItems.length === 0) {
      this.add.text(
        centerX,
        startY + 50,
        'No items available for purchase',
        {
          fontSize: isMobile ? '16px' : '20px',
          color: '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5, 0.5);
      return;
    }

    const itemHeight = isMobile ? 65 : 80;
    availableItems.forEach((item, index) => {
      this.createShopItemUI(item, centerX, startY + (index * itemHeight));
    });
  }

  private createShopItemUI(item: ShopItem, centerX: number, y: number): void {
    const currentCost = this.shopSystem.getItemCost(item.id);
    const canAfford = this.progressManager.canAfford(currentCost);
    const purchaseCount = this.shopSystem.getItemPurchaseCount(item.id);
    const isMobile = GAME_CONFIG.IS_MOBILE;

    // Responsive sizing
    const itemWidth = isMobile ? Math.min(this.cameras.main.width - 20, 380) : 600;
    const itemHeight = isMobile ? 60 : 70;
    const fontSize = {
      name: isMobile ? '14px' : '20px',
      description: isMobile ? '11px' : '14px',
      cost: isMobile ? '14px' : '20px',
      button: isMobile ? '13px' : '16px'
    };

    // Item background
    const itemBg = this.add.rectangle(centerX, y, itemWidth, itemHeight, 0x333333);
    itemBg.setStrokeStyle(2, canAfford ? 0x00F5FF : 0x666666);

    // Item name and owned count
    let nameText = item.name;
    if (purchaseCount > 0) {
      nameText += ` (${purchaseCount})`;
    }

    const leftMargin = isMobile ? -itemWidth / 2 + 10 : -280;
    const nameYOffset = isMobile ? -15 : -15;

    this.add.text(
      centerX + leftMargin,
      y + nameYOffset,
      nameText,
      {
        fontSize: fontSize.name,
        color: canAfford ? '#ffffff' : '#888888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);

    // Item description (shorter on mobile)
    const descriptionYOffset = isMobile ? 8 : 10;
    const maxDescriptionWidth = isMobile ? itemWidth - 120 : 500;

    this.add.text(
      centerX + leftMargin,
      y + descriptionYOffset,
      item.description,
      {
        fontSize: fontSize.description,
        color: canAfford ? '#cccccc' : '#666666',
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: maxDescriptionWidth }
      }
    ).setOrigin(0, 0.5);

    // Cost display
    const costXOffset = isMobile ? itemWidth / 2 - 80 : 150;
    const costText = this.add.text(
      centerX + costXOffset,
      y - 10,
      `-${currentCost}`,
      {
        fontSize: fontSize.cost,
        color: canAfford ? '#FF6B6B' : '#888888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    costText.setOrigin(0.5, 0.5);

    // Purchase button
    const btnColor = canAfford ? 0x00F5FF : 0x666666;
    const btnWidth = isMobile ? 60 : 100;
    const btnHeight = isMobile ? 35 : 40;
    const btnXOffset = isMobile ? itemWidth / 2 - 35 : 220;

    const purchaseBtn = this.add.rectangle(centerX + btnXOffset, y, btnWidth, btnHeight, btnColor);
    const btnText = this.add.text(
      centerX + btnXOffset,
      y,
      'BUY',
      {
        fontSize: fontSize.button,
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    btnText.setOrigin(0.5, 0.5);

    if (canAfford) {
      purchaseBtn.setInteractive({ useHandCursor: true });

      purchaseBtn.on('pointerover', () => {
        purchaseBtn.setFillStyle(0x00FFFF);
        this.tweens.add({
          targets: purchaseBtn,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100
        });
      });

      purchaseBtn.on('pointerout', () => {
        purchaseBtn.setFillStyle(0x00F5FF);
        purchaseBtn.setScale(1);
      });

      purchaseBtn.on('pointerdown', () => {
        this.purchaseItem(item.id);
      });
    }
  }

  private purchaseItem(itemId: string): void {
    const result = this.shopSystem.purchaseItem(itemId);

    if (this.messageText) {
      this.messageText.setText(result.message);
      this.messageText.setColor(result.success ? '#00FF00' : '#FF4444');

      // Animate message
      this.tweens.add({
        targets: this.messageText,
        scale: { from: 0, to: 1 },
        duration: 300,
        ease: 'Back.easeOut'
      });
    }

    if (result.success) {
      // Update score display
      if (this.pointsText) {
        this.pointsText.setText(
          `Total Score: ${this.progressManager.getTotalScore().toLocaleString()}`
        );
      }

      // Show updated total score in message
      if (this.messageText) {
        this.messageText.setText(
          `${result.message} - New Score: ${this.progressManager.getTotalScore().toLocaleString()}`
        );
      }

      // Refresh the shop display after purchase
      this.time.delayedCall(2000, () => {
        this.scene.restart();
      });
    }
  }

  private createContinueButton(centerX: number, y: number): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const btnWidth = isMobile ? 200 : 250;
    const btnHeight = isMobile ? 50 : 60;
    const btnFontSize = isMobile ? '18px' : '24px';

    const continueBtn = this.add.rectangle(centerX, y, btnWidth, btnHeight, 0x00F5FF);
    continueBtn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(
      centerX,
      y,
      'Start Next Round',
      {
        fontSize: btnFontSize,
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    btnText.setOrigin(0.5, 0.5);

    // Button hover effect
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
      this.startNextRound();
    });
  }

  private startNextRound(): void {
    const progressManager = GameProgressManager.getInstance();

    if (progressManager.isGameComplete()) {
      // Go to final game over scene
      this.scene.start('GameOverScene');
    } else {
      // Start next game round
      this.scene.start('GameScene');
    }
  }
}