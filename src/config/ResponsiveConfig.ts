/**
 * Responsive Configuration System
 * Centralizes all layout, typography, and design specifications for desktop and mobile
 */

/**
 * Detect if current device is mobile
 */
export const isMobile = (): boolean => window.innerWidth < 768;

/**
 * Get dynamic bottom safe area for mobile devices
 * Handles iOS notches and browser chrome
 */
export const getBottomSafeArea = (): number => {
  if (!isMobile()) return 60;

  // Check for iOS safe area - note: CSS env() doesn't work with getPropertyValue
  // Using a more reliable approach with fixed buffer
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // iOS Safari needs extra space for bottom bar
  if (isIOS && isSafari) {
    return 110; // Increased for better clearance
  }

  // Other mobile browsers
  return 90; // Increased from 80 for better safety margin
};

/**
 * Canvas configuration with responsive sizing
 */
export const getCanvasDimensions = () => {
  if (isMobile()) {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  // Desktop: flexible within constraints
  const width = Math.min(Math.max(window.innerWidth * 0.8, 900), 1200);
  const height = Math.min(Math.max(window.innerHeight * 0.9, 700), 900);

  return { width, height };
};

/**
 * Typography system for consistent text hierarchy
 */
export interface TypographyStyle {
  size: string;
  weight: string;
  lineHeight: number;
}

export const TYPOGRAPHY = {
  mobile: {
    h1: { size: '42px', weight: 'bold', lineHeight: 1.2 },      // Scene titles
    h2: { size: '32px', weight: 'bold', lineHeight: 1.3 },      // Sub-headers
    h3: { size: '24px', weight: '600', lineHeight: 1.3 },       // Card titles
    body: { size: '18px', weight: 'normal', lineHeight: 1.5 },  // Descriptions
    small: { size: '14px', weight: 'normal', lineHeight: 1.4 }, // Helper text
    score: { size: '32px', weight: 'bold', lineHeight: 1 }      // Numbers
  },
  desktop: {
    h1: { size: '56px', weight: 'bold', lineHeight: 1.2 },
    h2: { size: '42px', weight: 'bold', lineHeight: 1.3 },
    h3: { size: '28px', weight: '600', lineHeight: 1.3 },
    body: { size: '20px', weight: 'normal', lineHeight: 1.5 },
    small: { size: '16px', weight: 'normal', lineHeight: 1.4 },
    score: { size: '36px', weight: 'bold', lineHeight: 1 }
  }
};

/**
 * Button specifications for consistent touch targets
 */
export const BUTTON_SPECS = {
  mobile: {
    minHeight: 60,
    minWidth: 120,
    fontSize: '18px',
    fontWeight: 'bold',
    padding: '0 24px',
    borderRadius: 8
  },
  desktop: {
    minHeight: 65,
    minWidth: 200,
    fontSize: '20px',
    fontWeight: 'bold',
    padding: '0 32px',
    borderRadius: 8
  }
};

/**
 * Grid configuration for GameScene
 */
export const getGridConfig = () => {
  const GRID_SIZE = 8;
  const { width } = getCanvasDimensions();

  if (isMobile()) {
    const tileSpacing = 6;
    const horizontalPadding = 8;
    const maxGridWidth = width - (horizontalPadding * 2);
    const tileSize = Math.floor((maxGridWidth - ((GRID_SIZE - 1) * tileSpacing)) / GRID_SIZE);

    return {
      tileSize: Math.min(tileSize, 50), // Reduced from 60 to prevent footer overlap
      tileSpacing,
      tileBorderRadius: 2,
      offsetX: horizontalPadding,
      offsetY: 105, // Reduced from 110 to prevent footer overlap
      gridSize: GRID_SIZE
    };
  }

  // Desktop: larger tiles, better spacing
  const tileSize = 65; // Increase from 60px
  const tileSpacing = 8;
  const gridWidth = (GRID_SIZE * tileSize) + ((GRID_SIZE - 1) * tileSpacing);
  const offsetX = Math.floor((width - gridWidth) / 2);

  return {
    tileSize,
    tileSpacing,
    tileBorderRadius: 6,
    offsetX: Math.max(50, offsetX), // Minimum 50px margin
    offsetY: 115, // Reduced from 140 to prevent bottom cutoff
    gridSize: GRID_SIZE
  };
};

/**
 * GameScene UI layout configuration
 */
export const getGameSceneLayout = () => {
  const { width, height } = getCanvasDimensions();
  const bottomSafe = getBottomSafeArea();
  const gridConfig = getGridConfig();

  if (isMobile()) {
    // Calculate grid bottom position for combo placement
    const gridHeight = (8 * Math.min(50, gridConfig.tileSize)) + (7 * 6);
    const gridBottom = gridConfig.offsetY + gridHeight;

    return {
      header: {
        roundText: { x: width / 2, y: 25, fontSize: '28px', fontWeight: 'bold' },
        totalScore: { x: width / 2, y: 70, fontSize: '22px', fontWeight: '600' }
      },
      footer: {
        timer: { x: 20, y: height - bottomSafe - 20, fontSize: '32px', fontWeight: 'bold', align: 'left' },
        score: { x: width - 20, y: height - bottomSafe - 20, fontSize: '32px', fontWeight: 'bold', align: 'right' }
      },
      combo: {
        x: width / 2,
        y: gridBottom + 8, // Below grid, above footer
        fontSize: '20px',
        fontWeight: 'bold'
      }
    };
  }

  // Desktop layout - align with grid
  return {
    header: {
      roundText: { x: gridConfig.offsetX, y: 35, fontSize: '32px', fontWeight: 'bold' },
      totalScore: { x: gridConfig.offsetX, y: 80, fontSize: '24px', fontWeight: '600' }
    },
    headerRight: {
      timer: { x: width - 50, y: 35, fontSize: '28px', fontWeight: 'bold', align: 'right' },
      score: { x: width - 50, y: 80, fontSize: '28px', fontWeight: 'bold', align: 'right' }
    },
    combo: {
      x: width - 50,
      y: 115, // Below score on right side
      fontSize: '22px',
      fontWeight: 'bold'
    }
  };
};

/**
 * LeaderboardScene layout configuration
 */
export const getLeaderboardLayout = () => {
  const { width, height } = getCanvasDimensions();
  const bottomSafe = getBottomSafeArea();

  if (isMobile()) {
    return {
      header: { y: 30, fontSize: '32px', letterSpacing: '1px' },
      tabs: { y: 100, buttonHeight: 50, fontSize: '18px', gap: 12 },
      entries: {
        startY: 180,
        entryHeight: 80,
        maxVisible: 7,
        paddingVertical: 16,
        paddingHorizontal: 20,
        medalSize: 48,
        nameFontSize: '24px',
        nameFontWeight: '600',
        scoreFontSize: '28px',
        scoreFontWeight: 'bold'
      },
      bottomButtons: {
        y: height - bottomSafe - 140,
        buttonHeight: 60,
        gap: 12,
        fontSize: '20px'
      }
    };
  }

  // Desktop layout
  return {
    header: { y: 50, fontSize: '56px', letterSpacing: '2px' },
    tabs: { y: 140, buttonWidth: 200, buttonHeight: 55, fontSize: '20px', gap: 20 },
    entries: {
      startY: 230,
      entryHeight: 70,
      maxVisible: 4,
      width: 700,
      centerX: width / 2,
      paddingVertical: 16,
      paddingHorizontal: 24,
      medalSize: 48,
      nameFontSize: '26px',
      nameFontWeight: '600',
      scoreFontSize: '30px',
      scoreFontWeight: 'bold'
    },
    bottomButtons: {
      y: height - 80,
      buttonWidth: 280,
      buttonHeight: 65,
      gap: 40
    }
  };
};

/**
 * ShopScene layout configuration
 */
export const getShopLayout = () => {
  const { width: canvasWidth, height } = getCanvasDimensions();

  if (isMobile()) {
    return {
      header: { y: 20, fontSize: '30px', letterSpacing: '0px' },
      totalScore: { y: 52, fontSize: '20px', fontWeight: 'bold' },
      description: { y: 78, fontSize: '12px', lineHeight: 1.2, maxWidth: canvasWidth - 40 },
      warning: { y: 98, fontSize: '11px', color: '#ff6b9d' },
      pageIndicator: { y: 118, fontSize: '13px' },
      cards: {
        startY: 145,
        cardHeight: 85,
        gap: 10,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 12,
        paddingRight: 12,
        iconSize: 50,
        iconMarginRight: 12,
        titleFontSize: '17px',
        titleFontWeight: 'bold',
        titleMarginBottom: 4,
        descriptionFontSize: '11px',
        descriptionLineHeight: 1.1,
        descriptionColor: '#b0b0b0',
        costFontSize: '18px',
        costFontWeight: 'bold',
        costMarginRight: 10,
        buttonWidth: 70,
        buttonHeight: 36,
        buttonFontSize: '14px',
        buttonFontWeight: 'bold'
      },
      messageArea: { y: 460 },
      bottomButton: {
        y: height - 70,
        height: 55,
        width: canvasWidth - 40,
        fontSize: '18px'
      }
    };
  }

  // Desktop layout
  return {
    header: { y: 40, fontSize: '44px', letterSpacing: '1px' },
    totalScore: { y: 88, fontSize: '26px', fontWeight: 'bold' },
    description: { y: 125, fontSize: '17px', lineHeight: 1.3, maxWidth: 800 },
    warning: { y: 158, fontSize: '15px', color: '#ff6b9d' },
    pageIndicator: { y: 185, fontSize: '16px' },
    cards: {
      startY: 220,
      cardHeight: 110,
      width: 800,
      centerX: canvasWidth / 2,
      gap: 16,
      paddingTop: 18,
      paddingBottom: 18,
      paddingLeft: 22,
      paddingRight: 22,
      iconSize: 65,
      iconMarginRight: 18,
      titleFontSize: '24px',
      titleFontWeight: 'bold',
      titleMarginBottom: 7,
      descriptionFontSize: '15px',
      descriptionLineHeight: 1.25,
      descriptionColor: '#b0b0b0',
      costFontSize: '24px',
      costFontWeight: 'bold',
      costMarginRight: 14,
      buttonWidth: 95,
      buttonHeight: 48,
      buttonFontSize: '17px',
      buttonFontWeight: 'bold'
    },
    messageArea: { y: 600 },
    bottomButton: {
      y: height - 80,
      width: 400,
      height: 65,
      fontSize: '22px'
    }
  };
};

/**
 * RoundTransitionScene layout configuration
 */
export const getRoundTransitionLayout = () => {
  const { height } = getCanvasDimensions();
  const bottomSafe = getBottomSafeArea();

  if (isMobile()) {
    return {
      title: { y: 40, fontSize: '36px', fontWeight: 'bold' },
      roundScore: { y: 90, fontSize: '18px', marginBottom: 4 },
      totalScore: { y: 120, fontSize: '32px', fontWeight: 'bold' },
      rockets: {
        startY: 180,
        iconSize: 48,
        gap: 12,
        numberSize: '16px',
        numberOffset: 12
      },
      nextRound: { y: 300, fontSize: '18px' },
      buttons: {
        startY: height - bottomSafe - 140,
        buttonHeight: 60,
        gap: 12,
        fontSize: '18px'
      }
    };
  }

  // Desktop layout
  return {
    title: { y: 80, fontSize: '48px', fontWeight: 'bold' },
    roundScore: { y: 145, fontSize: '22px', marginBottom: 6 },
    totalScore: { y: 180, fontSize: '42px', fontWeight: 'bold' },
    rockets: {
      startY: 280,
      iconSize: 56,
      gap: 16,
      rowGap: 20,
      numberSize: '18px',
      numberOffset: 14
    },
    nextRound: { y: 430, fontSize: '22px' },
    buttons: {
      y: 540,
      buttonWidth: 280,
      buttonHeight: 70,
      gap: 40,
      fontSize: '22px'
    }
  };
};

/**
 * NameEntryScene layout configuration
 */
export const getNameEntryLayout = () => {
  const { width: canvasWidth, height } = getCanvasDimensions();

  if (isMobile()) {
    return {
      inputs: {
        startY: height * 0.38,
        inputHeight: 70,
        gap: 20,
        width: canvasWidth - 100,
        fontSize: '24px',
        padding: 20,
        borderRadius: 8,
        borderWidth: 3
      },
      placeholder: {
        y: height * 0.38 + 170,
        fontSize: '16px',
        color: '#808080'
      },
      submitButton: {
        y: height * 0.38 + 230,
        width: canvasWidth - 120,
        height: 65,
        fontSize: '22px'
      },
      skipButton: {
        y: height * 0.38 + 310,
        fontSize: '16px'
      }
    };
  }

  // Desktop layout
  return {
    inputs: {
      startY: height * 0.4,
      inputHeight: 70,
      gap: 24,
      width: 500,
      fontSize: '26px',
      padding: 22,
      borderRadius: 8,
      borderWidth: 3
    },
    placeholder: {
      y: height * 0.4 + 190,
      fontSize: '18px',
      color: '#808080'
    },
    submitButton: {
      y: height * 0.4 + 250,
      width: 400,
      height: 70,
      fontSize: '24px'
    },
    skipButton: {
      y: height * 0.4 + 350,
      fontSize: '18px'
    }
  };
};

/**
 * CampaignCompleteScene (GameOverScene) layout configuration
 */
export const getCampaignCompleteLayout = () => {
  const { height } = getCanvasDimensions();
  const bottomSafe = getBottomSafeArea();

  if (isMobile()) {
    return {
      title: { y: 40, fontSize: '32px', letterSpacing: '1px' },
      finalScore: { y: 95, fontSize: '36px', fontWeight: 'bold' },
      breakdown: {
        titleY: 150,
        titleSize: '24px',
        startY: 190,
        entryGap: 14,
        labelSize: '16px',
        scoreSize: '20px',
        fontWeight: '600'
      },
      stats: {
        startY: 320,
        gap: 16,
        labelSize: '16px',
        valueSize: '22px',
        display: true
      },
      encouragement: {
        y: height - bottomSafe - 180,
        fontSize: '16px',
        color: '#808080'
      },
      buttons: {
        startY: height - bottomSafe - 140,
        buttonHeight: 58,
        gap: 16,
        fontSize: '18px'
      }
    };
  }

  // Desktop layout
  return {
    title: { y: 60, fontSize: '48px', letterSpacing: '2px' },
    finalScore: { y: 130, fontSize: '48px', fontWeight: 'bold' },
    breakdown: {
      titleY: 200,
      titleSize: '32px',
      startY: 250,
      entryGap: 18,
      labelSize: '20px',
      scoreSize: '26px',
      fontWeight: '600'
    },
    stats: {
      startY: 420,
      gap: 20,
      labelSize: '18px',
      valueSize: '26px',
      display: true,
      layout: 'vertical' // Stack vertically to prevent overlap
    },
    encouragement: {
      y: height - 200,
      fontSize: '18px',
      color: '#808080'
    },
    buttons: {
      y: height - 110,
      buttonWidth: 280,
      buttonHeight: 65,
      gap: 30,
      fontSize: '20px'
    }
  };
};
