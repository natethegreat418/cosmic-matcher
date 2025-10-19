import * as Phaser from 'phaser';
import { GameProgressManager } from '../game/GameProgressManager';
import { ShopSystem } from '../game/ShopSystem';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { GAME_CONFIG } from '../types';
import type { ShopItem } from '../types/Progress';
import { getShopLayout, isMobile } from '../config/ResponsiveConfig';

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
    const mobile = isMobile();
    const layout = getShopLayout();

    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Shop header
    const headerText = this.add.text(
      centerX,
      layout.header.y,
      'COSMIC SHOP',
      {
        fontSize: layout.header.fontSize,
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: mobile ? 2 : 3
      }
    );
    headerText.setOrigin(0.5, 0.5);

    // Add cart icons
    const cartSize = mobile ? 32 : 40;
    this.add.text(
      centerX - headerText.width / 2 - cartSize - 10,
      layout.header.y,
      '🛒',
      { fontSize: `${cartSize}px` }
    ).setOrigin(0.5, 0.5);

    this.add.text(
      centerX + headerText.width / 2 + cartSize + 10,
      layout.header.y,
      '🛒',
      { fontSize: `${cartSize}px` }
    ).setOrigin(0.5, 0.5);

    // Animate header
    if (!this.hasAnimated) {
      this.tweens.add({
        targets: headerText,
        scale: { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut'
      });
      this.hasAnimated = true;
    }

    // Total score display
    this.pointsText = this.add.text(
      centerX,
      layout.totalScore.y,
      `Total Score: ${this.progressManager.getTotalScore().toLocaleString()}`,
      {
        fontSize: layout.totalScore.fontSize,
        color: '#F59E0B',
        fontFamily: 'Arial, sans-serif',
        fontStyle: layout.totalScore.fontWeight
      }
    );
    this.pointsText.setOrigin(0.5, 0.5);

    // Instructions
    this.add.text(
      centerX,
      layout.description.y,
      mobile ? 'Spend your score for upgrades' : 'Spend your score for upgrades that help in future rounds',
      {
        fontSize: layout.description.fontSize,
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5, 0.5);

    // Warning
    this.add.text(
      centerX,
      layout.warning.y,
      mobile ? 'Purchases reduce your total score!' : 'Each purchase permanently reduces your total score!',
      {
        fontSize: layout.warning.fontSize,
        color: layout.warning.color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5, 0.5);

    // Pagination controls
    const availableItems = this.shopSystem.getAvailableItems();
    const totalPages = Math.ceil(availableItems.length / this.itemsPerPage);
    if (totalPages > 1) {
      this.createPaginationControls(centerX, layout.pageIndicator.y, totalPages);
    }

    // Display shop items
    this.displayShopItems(centerX, layout.cards.startY);

    // Message area - use fixed position from layout to avoid overlaps
    const messageY = layout.messageArea?.y || (layout.cards.startY + 350);

    this.messageText = this.add.text(
      centerX,
      messageY,
      '',
      {
        fontSize: mobile ? '14px' : '16px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );
    this.messageText.setOrigin(0.5, 0.5);

    // Continue button - positioned below message with safe spacing
    this.createContinueButton(centerX, messageY);
  }

  private displayShopItems(centerX: number, startY: number): void {
    const availableItems = this.shopSystem.getAvailableItems();
    const mobile = isMobile();
    const layout = getShopLayout();

    if (availableItems.length === 0) {
      this.add.text(
        centerX,
        startY + 50,
        'No items available for purchase',
        {
          fontSize: mobile ? '16px' : '20px',
          color: '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5, 0.5);
      return;
    }

    // Create container for items
    if (this.itemContainer) {
      this.itemContainer.destroy();
    }
    this.itemContainer = this.add.container(0, 0);

    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, availableItems.length);

    const itemsToDisplay = availableItems.slice(startIndex, endIndex);
    itemsToDisplay.forEach((item, index) => {
      this.createShopItemUI(item, centerX, startY + (index * (layout.cards.cardHeight + layout.cards.gap)));
    });

    // Enable swipe on mobile
    if (mobile && availableItems.length > this.itemsPerPage) {
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
    const mobile = isMobile();
    const layout = getShopLayout();
    const { cards } = layout;

    // Responsive sizing from layout config - enforce max width constraint
    const itemWidth = mobile ? Math.min(this.cameras.main.width - 32, 400) : Math.min(cards.width || 800, 800);
    const itemHeight = cards.cardHeight;

    // Item background
    const itemBg = this.add.rectangle(centerX, y, itemWidth, itemHeight, 0x333333);
    itemBg.setStrokeStyle(2, canAfford ? 0x00F5FF : 0x666666);

    const leftMargin = -itemWidth / 2 + cards.paddingLeft;

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
        const icon = this.add.image(
          centerX + leftMargin + cards.iconSize / 2,
          y,
          iconKey
        );
        icon.setDisplaySize(cards.iconSize, cards.iconSize);
        icon.setOrigin(0.5, 0.5);

        if (!canAfford) {
          icon.setAlpha(0.5);
        }
      }
    }

    // Item name and owned count
    let nameText = item.name;
    if (purchaseCount > 0) {
      nameText += ` (${purchaseCount})`;
    }

    const iconOffset = item.icon ? cards.iconSize + cards.iconMarginRight : 0;
    const nameYOffset = mobile ? -18 : -cards.titleMarginBottom - 10;

    this.add.text(
      centerX + leftMargin + iconOffset,
      y + nameYOffset,
      nameText,
      {
        fontSize: cards.titleFontSize,
        color: canAfford ? '#ffffff' : '#888888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: cards.titleFontWeight
      }
    ).setOrigin(0, 0.5);

    // Item description
    const descriptionYOffset = mobile ? 6 : 10;
    const maxDescriptionWidth = mobile
      ? itemWidth - iconOffset - cards.paddingLeft - cards.paddingRight - 90
      : itemWidth - iconOffset - cards.paddingLeft - cards.paddingRight - 150;

    this.add.text(
      centerX + leftMargin + iconOffset,
      y + descriptionYOffset,
      item.description,
      {
        fontSize: cards.descriptionFontSize,
        color: canAfford ? cards.descriptionColor : '#666666',
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: maxDescriptionWidth }
      }
    ).setOrigin(0, 0.5);

    // Cost and button positioning
    const btnWidth = cards.buttonWidth;
    const btnHeight = cards.buttonHeight;

    if (mobile) {
      // Mobile: cost and button on the right side, vertically centered
      const btnXOffset = itemWidth / 2 - 48;

      // Cost above button - positioned higher
      const costText = this.add.text(
        centerX + btnXOffset,
        y - 16,
        `-${currentCost}`,
        {
          fontSize: cards.costFontSize,
          color: canAfford ? '#FF6B6B' : '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: cards.costFontWeight
        }
      );
      costText.setOrigin(0.5, 0.5);

      // Button below cost - positioned lower
      const btnColor = canAfford ? 0x00F5FF : 0x666666;
      const purchaseBtn = this.add.rectangle(centerX + btnXOffset, y + 12, btnWidth, btnHeight, btnColor);

      const btnText = this.add.text(
        centerX + btnXOffset,
        y + 12,
        'BUY',
        {
          fontSize: cards.buttonFontSize,
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontStyle: cards.buttonFontWeight
        }
      );
      btnText.setOrigin(0.5, 0.5);

      if (canAfford) {
        purchaseBtn.setInteractive({ useHandCursor: true });

        purchaseBtn.on('pointerover', () => {
          purchaseBtn.setFillStyle(0x66FFFF); // Primary hover: Lighter Bright Cyan
          this.tweens.add({
            targets: purchaseBtn,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100
          });
        });

        purchaseBtn.on('pointerout', () => {
          purchaseBtn.setFillStyle(0x00F5FF); // Primary: Bright Cyan
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
          fontSize: cards.costFontSize,
          color: canAfford ? '#FF6B6B' : '#888888',
          fontFamily: 'Arial, sans-serif',
          fontStyle: cards.costFontWeight
        }
      );
      costText.setOrigin(1, 0.5);

      // Purchase button
      const btnColor = canAfford ? 0x00F5FF : 0x666666;
      const purchaseBtn = this.add.rectangle(centerX + btnXOffset, y, btnWidth, btnHeight, btnColor);
      const btnText = this.add.text(
        centerX + btnXOffset,
        y,
        'BUY',
        {
          fontSize: cards.buttonFontSize,
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontStyle: cards.buttonFontWeight
        }
      );
      btnText.setOrigin(0.5, 0.5);

      if (canAfford) {
        purchaseBtn.setInteractive({ useHandCursor: true });

        purchaseBtn.on('pointerover', () => {
          purchaseBtn.setFillStyle(0x66FFFF); // Primary hover: Lighter Bright Cyan
          this.tweens.add({
            targets: purchaseBtn,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100
          });
        });

        purchaseBtn.on('pointerout', () => {
          purchaseBtn.setFillStyle(0x00F5FF); // Primary: Bright Cyan
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

  private createContinueButton(centerX: number, _y: number): void {
    const mobile = isMobile();
    const layout = getShopLayout();
    const screenWidth = this.cameras.main.width;

    const btnWidth = mobile ? (layout.bottomButton.width || screenWidth - 40) : (layout.bottomButton.width || 300);
    const btnHeight = layout.bottomButton.height;
    const btnFontSize = layout.bottomButton.fontSize;

    // Position button using layout config
    const buttonY = layout.bottomButton.y;

    // Create sticky shelf background for mobile
    if (mobile) {
      const shelfHeight = btnHeight + 40;
      const shelfY = buttonY - btnHeight / 2 - 20;

      const shelf = this.add.rectangle(
        centerX,
        shelfY + shelfHeight / 2,
        screenWidth,
        shelfHeight,
        0x1a1a1a
      );
      shelf.setScrollFactor(0);
      shelf.setDepth(1000);

      // Add top border
      const border = this.add.rectangle(
        centerX,
        shelfY,
        screenWidth,
        2,
        0x4a4a4a
      );
      border.setScrollFactor(0);
      border.setDepth(1000);
    }

    const continueBtn = this.add.rectangle(centerX, buttonY, btnWidth, btnHeight, 0x00F5FF);
    continueBtn.setInteractive({ useHandCursor: true });
    if (mobile) {
      continueBtn.setScrollFactor(0);
      continueBtn.setDepth(1001);
    }

    const btnText = this.add.text(
      centerX,
      buttonY,
      'Start Next Round',
      {
        fontSize: btnFontSize,
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    btnText.setOrigin(0.5, 0.5);
    if (mobile) {
      btnText.setScrollFactor(0);
      btnText.setDepth(1002);
    }

    // Button hover effect
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
    const fontSize = isMobile ? '14px' : '14px'; // Smaller pagination text
    const buttonSize = isMobile ? 32 : 32; // Smaller pagination buttons

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
        fontSize: '16px', // Smaller arrow
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
        prevBtn.setFillStyle(0x66FFFF); // Primary hover: Lighter Bright Cyan
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
        fontSize: '16px', // Smaller arrow
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
        nextBtn.setFillStyle(0x66FFFF); // Primary hover: Lighter Bright Cyan
      });

      nextBtn.on('pointerout', () => {
        nextBtn.setFillStyle(0x00F5FF);
      });
    }

    // Swipe hint on mobile - positioned below pagination to avoid overlap
    if (isMobile) {
      this.add.text(
        centerX,
        y + 22,
        'Swipe to browse',
        {
          fontSize: '11px',
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