import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../types';
import { getNameEntryLayout, isMobile } from '../config/ResponsiveConfig';
import { UIButton } from '../ui/UIButton';

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
    const mobile = isMobile();
    const layout = getNameEntryLayout();

    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Title
    this.add.text(
      centerX,
      layout.inputs.startY - 80,
      'Enter Your Name',
      {
        fontSize: mobile ? '28px' : '36px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Name input box
    const nameBox = this.add.rectangle(
      centerX,
      layout.inputs.startY,
      layout.inputs.width,
      layout.inputs.inputHeight,
      0x1a1a1a
    );
    nameBox.setStrokeStyle(layout.inputs.borderWidth, 0x00F5FF);

    this.nameText = this.add.text(
      centerX,
      layout.inputs.startY,
      '_',
      {
        fontSize: layout.inputs.fontSize,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5);

    // Hide text display on mobile (use HTML input instead)
    if (mobile) {
      this.nameText.setVisible(false);
    }

    // Instructions
    this.add.text(
      centerX,
      layout.placeholder.y,
      mobile ? 'Tap to enter name' : 'Type your name and press Enter',
      {
        fontSize: layout.placeholder.fontSize,
        color: layout.placeholder.color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5);

    // Handle input
    if (mobile) {
      this.createMobileInput(centerX, layout.inputs.startY);
      this.createSubmitButton(centerX, layout.submitButton.y);
    } else {
      this.input.keyboard?.on('keydown', this.handleKeyPress, this);
      this.createSubmitButton(centerX, layout.submitButton.y);
    }

    // Skip button
    this.createSkipButton(centerX, layout.skipButton.y);
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
    const layout = getNameEntryLayout();

    // Create HTML input element for native mobile keyboard
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Enter your name';
    input.style.position = 'absolute';
    input.style.left = `${x - layout.inputs.width / 2}px`;
    input.style.top = `${y - layout.inputs.inputHeight / 2}px`;
    input.style.width = `${layout.inputs.width}px`;
    input.style.height = `${layout.inputs.inputHeight}px`;
    input.style.fontSize = layout.inputs.fontSize;
    input.style.textAlign = 'center';
    input.style.backgroundColor = '#1a1a1a';
    input.style.color = '#ffffff';
    input.style.border = `${layout.inputs.borderWidth}px solid #00F5FF`;
    input.style.borderRadius = `${layout.inputs.borderRadius}px`;
    input.style.outline = 'none';
    input.style.fontFamily = 'Arial, sans-serif';
    input.style.padding = `${layout.inputs.padding}px`;

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
    const layout = getNameEntryLayout();

    UIButton.create(this, {
      x,
      y,
      width: layout.submitButton.width,
      height: layout.submitButton.height,
      text: 'Submit',
      variant: 'primary',
      fontSize: layout.submitButton.fontSize,
      onClick: () => this.submitName()
    });
  }

  private createSkipButton(x: number, y: number): void {
    const layout = getNameEntryLayout();

    const skipBtn = this.add.text(
      x,
      y,
      'Skip',
      {
        fontSize: layout.skipButton.fontSize,
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
