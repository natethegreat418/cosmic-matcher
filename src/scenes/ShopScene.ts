import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { ShopSystem } from '../game/ShopSystem';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { GAME_CONFIG } from '../types';
import type { ShopItem } from '../types/Progress';

export class ShopScene extends Phaser.Scene {
  private shopSystem!: ShopSystem;
  private progressManager!: GameProgressManager;
  private pointsText?: Phaser.GameObjects.Text;
  private messageText?: Phaser.GameObjects.Text;
  private currentPage: number = 0;
  private itemsPerPage: number = 3;
  private itemContainer?: Phaser.GameObjects.Container;
  private hasAnimated: boolean = false;

  constructor() {
    super({ key: 'ShopScene' });
  }

  preload(): void {
    // Preload shop item icons
    this.load.image('radiation-shield', '/shop/radiation-shield.png');
    this.load.image('quantum-dilation', '/shop/quantum-dilation.png');
    this.load.image('phaser', '/shop/phaser.png');
    this.load.image('tractor-beam', '/shop/tractor-beam.png');
  }

  create(): void {
    this.shopSystem = ShopSystem.getInstance();
    this.progressManager = GameProgressManager.getInstance();

    const centerX = this.cameras.main.width / 2;
    const isMobile = GAME_CONFIG.IS_MOBILE;

    // Background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Responsive font sizes - reduced to fit more content
    const fontSize = {
      header: isMobile ? '26px' : '36px',
      score: isMobile ? '18px' : '24px',
      instructions: isMobile ? '12px' : '14px',
      warning: isMobile ? '11px' : '13px',
      message: isMobile ? '14px' : '16px',
      button: isMobile ? '18px' : '22px',
      hint: isMobile ? '11px' : '14px'
    };

    let currentY = isMobile ? 30 : 50;

    // Shop header
    const headerText = this.add.text(
      centerX,
      currentY,
      '🛒 COSMIC SHOP 🛒',
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

    // Animate header only on first load
    if (!this.hasAnimated) {
      this.tweens.add({
        targets: headerText,
        scale: { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut'
      });
      this.hasAnimated = true;
    }

    currentY += isMobile ? 30 : 45;

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

    currentY += isMobile ? 25 : 35;

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

    currentY += isMobile ? 15 : 18;

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

    currentY += isMobile ? 25 : 35;

    // Display shop items with pagination
    const itemsStartY = currentY;
    const itemHeight = isMobile ? 110 : 120;
    this.displayShopItems(centerX, itemsStartY);

    // Calculate position for message and pagination controls
    const availableItems = this.shopSystem.getAvailableItems();
    const visibleItems = Math.min(availableItems.length, this.itemsPerPage);
    currentY = itemsStartY + (visibleItems > 0 ? visibleItems * itemHeight + 10 : 70);

    // Pagination controls
    const totalPages = Math.ceil(availableItems.length / this.itemsPerPage);
    if (totalPages > 1) {
      this.createPaginationControls(centerX, currentY, totalPages);
      currentY += isMobile ? 60 : 70;
    }

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

    currentY += isMobile ? 30 : 40;

    // Continue button - ensure it's visible by adding more spacing
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

    // Create container for items (for easier pagination)
    if (this.itemContainer) {
      this.itemContainer.destroy();
    }
    this.itemContainer = this.add.container(0, 0);

    const itemHeight = isMobile ? 110 : 120;
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, availableItems.length);

    const itemsToDisplay = availableItems.slice(startIndex, endIndex);
    itemsToDisplay.forEach((item, index) => {
      this.createShopItemUI(item, centerX, startY + (index * itemHeight));
    });

    // Enable swipe on mobile
    if (isMobile && availableItems.length > this.itemsPerPage) {
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.input.once('pointerup', (pointerUp: Phaser.Input.Pointer) => {
          const swipeDistance = pointerUp.x - pointer.x;
          const totalPages = Math.ceil(availableItems.length / this.itemsPerPage);

          if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance < 0 && this.currentPage < totalPages - 1) {
              // Swipe left - next page
              this.currentPage++;
              this.refreshShopDisplay();
            } else if (swipeDistance > 0 && this.currentPage > 0) {
              // Swipe right - previous page
              this.currentPage--;
              this.refreshShopDisplay();
            }
          }
        });
      });
    }
  }

  private createShopItemUI(item: ShopItem, centerX: number, y: number): void {
    const currentCost = this.shopSystem.getItemCost(item.id);
    const canAfford = this.progressManager.canAfford(currentCost);
    const purchaseCount = this.shopSystem.getItemPurchaseCount(item.id);
    const isMobile = GAME_CONFIG.IS_MOBILE;

    // Responsive sizing - increased height for larger icons
    const itemWidth = isMobile ? Math.min(this.cameras.main.width - 30, 370) : 700;
    const itemHeight = isMobile ? 100 : 110;
    const fontSize = {
      name: isMobile ? '14px' : '20px',
      description: isMobile ? '11px' : '14px',
      cost: isMobile ? '14px' : '20px',
      button: isMobile ? '13px' : '16px'
    };

    // Item background
    const itemBg = this.add.rectangle(centerX, y, itemWidth, itemHeight, 0x333333);
    itemBg.setStrokeStyle(2, canAfford ? 0x00F5FF : 0x666666);

    const leftMargin = isMobile ? -itemWidth / 2 + 5 : -340;
    const iconPadding = 5;

    // Icon (if available) - left aligned
    if (item.icon) {
      let iconKey: string | null = null;

      if (item.icon.includes('radiation')) {
        iconKey = 'radiation-shield';
      } else if (item.icon.includes('quantum')) {
        iconKey = 'quantum-dilation';
      } else if (item.icon.includes('phaser')) {
        iconKey = 'phaser';
      } else if (item.icon.includes('tractor')) {
        iconKey = 'tractor-beam';
      }

      if (iconKey && this.textures.exists(iconKey)) {
        const iconSize = isMobile ? 70 : 100;
        const icon = this.add.image(
          centerX + leftMargin + iconPadding + iconSize / 2,
          y,
          iconKey
        );
        // Force square dimensions to preserve circular shape
        icon.setDisplaySize(iconSize, iconSize);
        icon.setOrigin(0.5, 0.5);

        if (!canAfford) {
          icon.setAlpha(0.5);
        }
      }
    }

    // Item name and owned count - offset right if there's an icon
    let nameText = item.name;
    if (purchaseCount > 0) {
      nameText += ` (${purchaseCount})`;
    }

    const iconSize = isMobile ? 70 : 100;
    const iconOffset = item.icon ? iconPadding + iconSize + 8 : 0;
    const nameYOffset = isMobile ? -20 : -15;

    this.add.text(
      centerX + leftMargin + iconOffset,
      y + nameYOffset,
      nameText,
      {
        fontSize: fontSize.name,
        color: canAfford ? '#ffffff' : '#888888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);

    // Item description (shorter on mobile) - also offset if there's an icon
    const descriptionYOffset = isMobile ? 15 : 10;
    const maxDescriptionWidth = isMobile ? itemWidth - 160 - iconOffset : 500;

    this.add.text(
      centerX + leftMargin + iconOffset,
      y + descriptionYOffset,
      item.description,
      {
        fontSize: fontSize.description,
        color: canAfford ? '#cccccc' : '#666666',
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: maxDescriptionWidth }
      }
    ).setOrigin(0, 0.5);

    // Cost and button positioning - arranged in a row on mobile
    const btnWidth = isMobile ? 60 : 100;
    const btnHeight = isMobile ? 35 : 40;

    if (isMobile) {
      // Mobile: cost stacked above button
      const btnXOffset = itemWidth / 2 - 40;

      // Cost above button
      const costText = this.add.text(
        centerX + btnXOffset,
        y - 18,
        `-${currentCost}`,
        {
          fontSize: '13px',
          color: canAfford ? '#FF6B6B' : '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );
      costText.setOrigin(0.5, 0.5);

      // Button below cost
      const btnColor = canAfford ? 0x10B981 : 0x666666;
      const purchaseBtn = this.add.rectangle(centerX + btnXOffset, y + 5, btnWidth, btnHeight, btnColor);

      const btnText = this.add.text(
        centerX + btnXOffset,
        y + 5,
        'BUY',
        {
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );
      btnText.setOrigin(0.5, 0.5);

      if (canAfford) {
        purchaseBtn.setInteractive({ useHandCursor: true });

        purchaseBtn.on('pointerover', () => {
          purchaseBtn.setFillStyle(0x14D89A);
          this.tweens.add({
            targets: purchaseBtn,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100
          });
        });

        purchaseBtn.on('pointerout', () => {
          purchaseBtn.setFillStyle(0x10B981);
          purchaseBtn.setScale(1);
        });

        purchaseBtn.on('pointerdown', () => {
          this.purchaseItem(item.id);
        });
      }
    } else {
      // Desktop: original layout with cost to the left of button
      const btnXOffset = 280;
      const costXOffset = btnXOffset - btnWidth / 2 - 50;

      const costText = this.add.text(
        centerX + costXOffset,
        y,
        `-${currentCost}`,
        {
          fontSize: fontSize.cost,
          color: canAfford ? '#FF6B6B' : '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      );
      costText.setOrigin(1, 0.5);

      // Purchase button (green color #10B981)
      const btnColor = canAfford ? 0x10B981 : 0x666666;
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
          purchaseBtn.setFillStyle(0x14D89A); // Lighter green
          this.tweens.add({
            targets: purchaseBtn,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100
          });
        });

        purchaseBtn.on('pointerout', () => {
          purchaseBtn.setFillStyle(0x10B981); // Original green
          purchaseBtn.setScale(1);
        });

        purchaseBtn.on('pointerdown', () => {
          this.purchaseItem(item.id);
        });
      }
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
      // Auto-save after successful purchase
      LocalStorageManager.saveGame();

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

  private createPaginationControls(centerX: number, y: number, totalPages: number): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const fontSize = isMobile ? '16px' : '18px';
    const buttonSize = isMobile ? 40 : 50;

    // Page indicator text
    const pageText = this.add.text(
      centerX,
      y,
      `Page ${this.currentPage + 1} of ${totalPages}`,
      {
        fontSize: fontSize,
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif'
      }
    );
    pageText.setOrigin(0.5, 0.5);
    pageText.setName('pageText');

    // Previous button
    if (this.currentPage > 0) {
      const prevBtn = this.add.rectangle(centerX - 120, y, buttonSize, buttonSize, 0x00F5FF);
      prevBtn.setInteractive({ useHandCursor: true });

      const prevText = this.add.text(centerX - 120, y, '◀', {
        fontSize: isMobile ? '20px' : '24px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      });
      prevText.setOrigin(0.5, 0.5);

      prevBtn.on('pointerdown', () => {
        this.currentPage--;
        this.refreshShopDisplay();
      });

      prevBtn.on('pointerover', () => {
        prevBtn.setFillStyle(0x00FFFF);
      });

      prevBtn.on('pointerout', () => {
        prevBtn.setFillStyle(0x00F5FF);
      });
    }

    // Next button
    if (this.currentPage < totalPages - 1) {
      const nextBtn = this.add.rectangle(centerX + 120, y, buttonSize, buttonSize, 0x00F5FF);
      nextBtn.setInteractive({ useHandCursor: true });

      const nextText = this.add.text(centerX + 120, y, '▶', {
        fontSize: isMobile ? '20px' : '24px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      });
      nextText.setOrigin(0.5, 0.5);

      nextBtn.on('pointerdown', () => {
        this.currentPage++;
        this.refreshShopDisplay();
      });

      nextBtn.on('pointerover', () => {
        nextBtn.setFillStyle(0x00FFFF);
      });

      nextBtn.on('pointerout', () => {
        nextBtn.setFillStyle(0x00F5FF);
      });
    }

    // Swipe hint on mobile
    if (isMobile) {
      this.add.text(
        centerX,
        y + 25,
        'Swipe to browse items',
        {
          fontSize: '12px',
          color: '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5, 0.5);
    }
  }

  private refreshShopDisplay(): void {
    // Restart the scene to refresh all displays
    this.scene.restart();
  }
}