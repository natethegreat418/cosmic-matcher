import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../types';

/**
 * Scene for entering player name for leaderboard submission
 */
export class NameEntryScene extends Phaser.Scene {
  private playerName: string = '';
  private nameText?: Phaser.GameObjects.Text;
  private onNameEntered?: (name: string) => void;
  private inputElement?: HTMLInputElement;

  constructor() {
    super({ key: 'NameEntryScene' });
  }

  init(data: { onNameEntered: (name: string) => void }): void {
    this.onNameEntered = data.onNameEntered;
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const isMobile = GAME_CONFIG.IS_MOBILE;

    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Title
    this.add.text(
      centerX,
      centerY - (isMobile ? 120 : 150),
      'Enter Your Name',
      {
        fontSize: isMobile ? '28px' : '36px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Name display box
    const boxWidth = isMobile ? 280 : 400;
    const boxHeight = isMobile ? 50 : 60;

    const nameBox = this.add.rectangle(
      centerX,
      centerY - (isMobile ? 40 : 50),
      boxWidth,
      boxHeight,
      0x1a1a1a
    );
    nameBox.setStrokeStyle(2, 0x00F5FF);

    this.nameText = this.add.text(
      centerX,
      centerY - (isMobile ? 40 : 50),
      '_',
      {
        fontSize: isMobile ? '24px' : '28px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5);

    // Instructions
    this.add.text(
      centerX,
      centerY + (isMobile ? 30 : 40),
      isMobile ? 'Tap to enter name' : 'Type your name and press Enter',
      {
        fontSize: isMobile ? '14px' : '16px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5);

    // Handle mobile input (HTML input field)
    if (isMobile) {
      this.createMobileInput(centerX, centerY - 40);

      // Create submit button for mobile
      this.createSubmitButton(centerX, centerY + 80);
    } else {
      // Desktop keyboard input
      this.input.keyboard?.on('keydown', this.handleKeyPress, this);

      // Create submit button
      this.createSubmitButton(centerX, centerY + 100);
    }

    // Skip button
    this.createSkipButton(centerX, centerY + (isMobile ? 160 : 180));
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.submitName();
      return;
    }

    if (event.key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
      this.updateNameDisplay();
      return;
    }

    // Only accept letters, numbers, spaces (max 20 chars)
    if (this.playerName.length < 20 && /^[a-zA-Z0-9 ]$/.test(event.key)) {
      this.playerName += event.key;
      this.updateNameDisplay();
    }
  }

  private createMobileInput(x: number, y: number): void {
    // Create HTML input element for native mobile keyboard
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Enter your name';
    input.style.position = 'absolute';
    input.style.left = `${x - 140}px`;
    input.style.top = `${y - 25}px`;
    input.style.width = '280px';
    input.style.height = '50px';
    input.style.fontSize = '24px';
    input.style.textAlign = 'center';
    input.style.backgroundColor = '#1a1a1a';
    input.style.color = '#ffffff';
    input.style.border = '2px solid #00F5FF';
    input.style.borderRadius = '4px';
    input.style.outline = 'none';
    input.style.fontFamily = 'Arial, sans-serif';

    // Add to DOM
    const gameCanvas = this.game.canvas.parentElement;
    if (gameCanvas) {
      gameCanvas.appendChild(input);
      this.inputElement = input;

      // Focus the input to trigger keyboard
      setTimeout(() => input.focus(), 100);

      // Update name as user types
      input.addEventListener('input', () => {
        this.playerName = input.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 20);
        this.updateNameDisplay();
      });

      // Submit on Enter key
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitName();
        }
      });
    }
  }

  private updateNameDisplay(): void {
    if (this.nameText) {
      this.nameText.setText(this.playerName || '_');
    }
  }

  private createSubmitButton(x: number, y: number): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const btnWidth = isMobile ? 200 : 200;
    const btnHeight = isMobile ? 50 : 60;

    const btn = this.add.rectangle(x, y, btnWidth, btnHeight, 0x10B981);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(
      x,
      y,
      'Submit',
      {
        fontSize: isMobile ? '20px' : '24px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    btnText.setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x14D89A);
      this.tweens.add({
        targets: btn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(0x10B981);
      btn.setScale(1);
    });

    btn.on('pointerdown', () => {
      this.submitName();
    });
  }

  private createSkipButton(x: number, y: number): void {
    const isMobile = GAME_CONFIG.IS_MOBILE;

    const skipBtn = this.add.text(
      x,
      y,
      'Skip',
      {
        fontSize: isMobile ? '16px' : '18px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    );
    skipBtn.setOrigin(0.5);
    skipBtn.setInteractive({ useHandCursor: true });

    skipBtn.on('pointerover', () => {
      skipBtn.setColor('#ffffff');
    });

    skipBtn.on('pointerout', () => {
      skipBtn.setColor('#888888');
    });

    skipBtn.on('pointerdown', () => {
      this.submitName('Anonymous');
    });
  }

  private submitName(defaultName?: string): void {
    const finalName = defaultName || this.playerName.trim() || 'Anonymous';

    if (this.onNameEntered) {
      this.onNameEntered(finalName);
    }

    // Clean up
    this.cleanup();

    this.scene.stop();
  }

  private cleanup(): void {
    // Remove HTML input element if it exists
    if (this.inputElement && this.inputElement.parentElement) {
      this.inputElement.parentElement.removeChild(this.inputElement);
      this.inputElement = undefined;
    }

    // Clean up keyboard listener
    if (!GAME_CONFIG.IS_MOBILE) {
      this.input.keyboard?.off('keydown', this.handleKeyPress, this);
    }
  }

  shutdown(): void {
    this.cleanup();
  }
}
