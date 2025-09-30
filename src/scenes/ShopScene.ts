import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { ShopSystem } from '../game/ShopSystem';
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

    // Background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Shop header
    const headerText = this.add.text(
      centerX,
      80,
      '⭐ COSMIC SHOP ⭐',
      {
        fontSize: '42px',
        color: '#F59E0B', // Solar gold
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
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

    // Current score display
    this.pointsText = this.add.text(
      centerX,
      140,
      `Total Score: ${this.progressManager.getTotalScore().toLocaleString()}`,
      {
        fontSize: '28px',
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    this.pointsText.setOrigin(0.5, 0.5);

    // Instructions
    this.add.text(
      centerX,
      180,
      'Spend your score for upgrades that help in future rounds',
      {
        fontSize: '16px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    // Warning about spending
    this.add.text(
      centerX,
      200,
      'Each purchase permanently reduces your total score!',
      {
        fontSize: '14px',
        color: '#FF6B6B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5, 0.5);

    // Display shop items
    this.displayShopItems(centerX, 260);

    // Message area for feedback
    this.messageText = this.add.text(
      centerX,
      420,
      '',
      {
        fontSize: '18px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );
    this.messageText.setOrigin(0.5, 0.5);

    // Continue button
    this.createContinueButton(centerX, 520);

    // Skip shop hint
    this.add.text(
      centerX,
      600,
      'Press SPACE to continue without purchasing',
      {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    // Add keyboard shortcut
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.startNextRound();
    });
  }

  private displayShopItems(centerX: number, startY: number): void {
    const availableItems = this.shopSystem.getAvailableItems();

    if (availableItems.length === 0) {
      this.add.text(
        centerX,
        startY + 50,
        'No items available for purchase',
        {
          fontSize: '20px',
          color: '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5, 0.5);
      return;
    }

    availableItems.forEach((item, index) => {
      this.createShopItemUI(item, centerX, startY + (index * 80));
    });
  }

  private createShopItemUI(item: ShopItem, centerX: number, y: number): void {
    const currentCost = this.shopSystem.getItemCost(item.id);
    const canAfford = this.progressManager.canAfford(currentCost);
    const purchaseCount = this.shopSystem.getItemPurchaseCount(item.id);

    // Item background
    const itemBg = this.add.rectangle(centerX, y, 600, 70, 0x333333);
    itemBg.setStrokeStyle(2, canAfford ? 0x00F5FF : 0x666666);

    // Item name and owned count
    let nameText = item.name;
    if (purchaseCount > 0) {
      nameText += ` (Owned: ${purchaseCount})`;
    }

    this.add.text(
      centerX - 280,
      y - 15,
      nameText,
      {
        fontSize: '20px',
        color: canAfford ? '#ffffff' : '#888888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);

    // Item description
    this.add.text(
      centerX - 280,
      y + 10,
      item.description,
      {
        fontSize: '14px',
        color: canAfford ? '#cccccc' : '#666666',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0, 0.5);

    // Cost display
    const costText = this.add.text(
      centerX + 150,
      y - 10,
      `-${currentCost}`,
      {
        fontSize: '20px',
        color: canAfford ? '#FF6B6B' : '#888888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    costText.setOrigin(0.5, 0.5);

    // Purchase button
    const btnColor = canAfford ? 0x00F5FF : 0x666666;
    const purchaseBtn = this.add.rectangle(centerX + 220, y, 100, 40, btnColor);
    const btnText = this.add.text(
      centerX + 220,
      y,
      'BUY',
      {
        fontSize: '16px',
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
    const continueBtn = this.add.rectangle(centerX, y, 250, 60, 0x00F5FF);
    continueBtn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(
      centerX,
      y,
      'Start Next Round',
      {
        fontSize: '24px',
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