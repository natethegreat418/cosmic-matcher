# Cosmic Matcher - UX/UI Refinement Specifications

## 1. RESPONSIVE CANVAS SIZING

### Current Issues:
- Desktop fixed at 900x700 creates artificial constraints
- Mobile dynamic sizing but capped tile sizes limit gameplay area
- Inconsistent padding/margins across scenes

### Specifications:

```typescript
// Canvas Configuration
DESKTOP_CONFIG = {
  minWidth: 900,
  maxWidth: 1200,
  minHeight: 700,
  maxHeight: 900,
  aspectRatio: 9/7 // maintain proportions
}

MOBILE_CONFIG = {
  width: window.innerWidth,
  height: window.innerHeight,
  maxTileSize: 60, // increase from 50px
  minTileSize: 35
}
```

## 2. GRID & GAMEPLAY SCENE

### Mobile Improvements:

```typescript
// GameScene positioning
MOBILE_GRID = {
  offsetX: 8, // reduce from 10 for more space
  offsetY: 120, // increase from 80 for better header
  tileSize: Math.min(60, (width - 16) / 8), // calculate dynamically
  gap: 6, // explicit gap between tiles
}

// Top UI
MOBILE_HEADER = {
  roundText: {
    y: 20,
    fontSize: '28px',
    fontWeight: 'bold'
  },
  totalScore: {
    y: 60,
    fontSize: '22px',
    fontWeight: '600'
  }
}

// Bottom UI  
MOBILE_FOOTER = {
  timer: {
    x: 16,
    y: height - 100, // adjust for bottomSafeArea
    fontSize: '32px',
    fontWeight: 'bold'
  },
  score: {
    x: width - 16,
    y: height - 100,
    fontSize: '32px',
    fontWeight: 'bold',
    align: 'right'
  }
}
```

### Desktop Improvements:

```typescript
// GameScene positioning
DESKTOP_GRID = {
  offsetX: 50, // center with more margin
  offsetY: 140,
  tileSize: 65, // larger tiles for desktop
  gap: 8,
  // Grid should be centered: (900 - (65*8 + 8*7)) / 2
}

// Top UI - consolidate to left side
DESKTOP_HEADER = {
  roundText: {
    x: 50,
    y: 30,
    fontSize: '32px'
  },
  totalScore: {
    x: 50,
    y: 75,
    fontSize: '24px'
  }
}

// Top Right UI
DESKTOP_HEADER_RIGHT = {
  timer: {
    x: width - 50,
    y: 30,
    fontSize: '28px',
    align: 'right'
  },
  score: {
    x: width - 50,
    y: 70,
    fontSize: '28px',
    align: 'right'
  }
}
```

## 3. LEADERBOARD SCENE

### Mobile Issues:
- Massive wasted space below entries
- Only 2 entries visible when 5-7 could fit

```typescript
MOBILE_LEADERBOARD = {
  header: {
    y: 30,
    fontSize: '42px',
    letterSpacing: '2px'
  },
  tabs: {
    y: 100,
    buttonHeight: 50,
    fontSize: '18px',
    gap: 12
  },
  entries: {
    startY: 180,
    entryHeight: 80, // increase from ~60
    maxVisible: 7,
    padding: {
      vertical: 16,
      horizontal: 20
    },
    medal: {
      size: 48
    },
    name: {
      fontSize: '24px',
      fontWeight: '600'
    },
    score: {
      fontSize: '28px',
      fontWeight: 'bold'
    }
  },
  bottomButtons: {
    y: height - bottomSafeArea - 140, // two buttons stacked
    buttonHeight: 60,
    gap: 12,
    fontSize: '20px'
  }
}
```

### Desktop:

```typescript
DESKTOP_LEADERBOARD = {
  header: {
    y: 50,
    fontSize: '56px'
  },
  tabs: {
    y: 140,
    buttonWidth: 200,
    buttonHeight: 55,
    fontSize: '20px',
    gap: 20
  },
  entries: {
    startY: 230,
    entryHeight: 70,
    maxVisible: 5,
    width: 700, // constrain width for better readability
    centerX: 450,
    padding: {
      vertical: 16,
      horizontal: 24
    }
  },
  bottomButtons: {
    y: height - 80,
    buttonWidth: 280,
    buttonHeight: 65,
    gap: 40
  }
}
```

## 4. SHOP SCENE

### Mobile Issues:
- Inconsistent card padding
- Uneven spacing between cards
- Text hierarchy unclear

```typescript
MOBILE_SHOP = {
  header: {
    y: 30,
    fontSize: '38px',
    letterSpacing: '1px'
  },
  totalScore: {
    y: 80,
    fontSize: '24px',
    fontWeight: 'bold'
  },
  description: {
    y: 115,
    fontSize: '14px',
    lineHeight: 1.4,
    maxWidth: width - 40
  },
  warning: {
    y: 155,
    fontSize: '13px',
    color: '#ff6b9d' // pink/magenta
  },
  pageIndicator: {
    y: 185,
    fontSize: '16px'
  },
  cards: {
    startY: 220,
    cardHeight: 110,
    gap: 16, // consistent between cards
    padding: {
      top: 16,
      bottom: 16,
      left: 20,
      right: 20
    },
    icon: {
      size: 60,
      marginRight: 16
    },
    title: {
      fontSize: '22px',
      fontWeight: 'bold',
      marginBottom: 6
    },
    description: {
      fontSize: '14px',
      lineHeight: 1.3,
      color: '#b0b0b0'
    },
    cost: {
      fontSize: '22px',
      fontWeight: 'bold',
      marginRight: 12
    },
    button: {
      width: 80,
      height: 44,
      fontSize: '16px',
      fontWeight: 'bold'
    }
  },
  bottomButton: {
    y: height - bottomSafeArea - 70,
    height: 60,
    fontSize: '20px'
  }
}
```

### Desktop:

```typescript
DESKTOP_SHOP = {
  header: {
    y: 50,
    fontSize: '48px'
  },
  cards: {
    startY: 250,
    cardHeight: 120,
    width: 800, // constrain for readability
    centerX: 450,
    gap: 20,
    // Same padding structure as mobile but scaled
  },
  bottomButton: {
    y: height - 90,
    width: 400,
    height: 70
  }
}
```

## 5. ROUND TRANSITION SCENE

### Mobile Issues:
- Rocket indicators too small (barely visible)
- Could show more information

```typescript
MOBILE_ROUND_TRANSITION = {
  title: {
    y: 40,
    fontSize: '36px',
    fontWeight: 'bold'
  },
  roundScore: {
    y: 90,
    fontSize: '18px',
    marginBottom: 4
  },
  totalScore: {
    y: 120,
    fontSize: '32px',
    fontWeight: 'bold'
  },
  rockets: {
    startY: 180,
    iconSize: 48, // increase from ~32
    gap: 12, // increase from ~8
    numberSize: '16px',
    numberOffset: 12
  },
  nextRound: {
    y: 300,
    fontSize: '18px'
  },
  buttons: {
    startY: height - bottomSafeArea - 140,
    buttonHeight: 60,
    gap: 12,
    fontSize: '18px'
  }
}
```

### Desktop:

```typescript
DESKTOP_ROUND_TRANSITION = {
  title: {
    y: 80,
    fontSize: '48px'
  },
  rockets: {
    startY: 280,
    iconSize: 56,
    gap: 16,
    // Two rows of 5
    rowGap: 20
  },
  buttons: {
    y: 540,
    buttonWidth: 280,
    buttonHeight: 70,
    gap: 40
  }
}
```

## 6. NAME ENTRY SCENE

### Mobile Issues:
- Duplicate inputs
- Input fields feel small and cramped
- Could be more inviting

```typescript
MOBILE_NAME_ENTRY = {
  inputs: {
    startY: height * 0.35, // center vertically
    inputHeight: 70, // increase from ~50
    gap: 20,
    width: width - 60,
    fontSize: '24px',
    padding: 20,
    borderRadius: 8,
    borderWidth: 3
  },
  placeholder: {
    y: height * 0.35 + 170,
    fontSize: '16px',
    color: '#808080'
  },
  submitButton: {
    y: height * 0.35 + 230,
    width: width - 100,
    height: 65,
    fontSize: '22px'
  },
  skipButton: {
    y: height * 0.35 + 320,
    fontSize: '16px'
  }
}
```

## 7. CAMPAIGN COMPLETE SCENE

### Specifications:

```typescript
MOBILE_CAMPAIGN_COMPLETE = {
  title: {
    y: 50,
    fontSize: '32px',
    letterSpacing: '1px'
  },
  finalScore: {
    y: 110,
    fontSize: '36px',
    fontWeight: 'bold'
  },
  breakdown: {
    titleY: 180,
    titleSize: '24px',
    startY: 220,
    entryGap: 16,
    labelSize: '18px',
    scoreSize: '22px',
    fontWeight: '600'
  },
  stats: { // if shown
    startY: 360,
    gap: 20,
    labelSize: '16px',
    valueSize: '24px'
  },
  encouragement: {
    y: height - bottomSafeArea - 200,
    fontSize: '18px',
    color: '#808080'
  },
  buttons: {
    startY: height - bottomSafeArea - 140,
    buttonHeight: 60,
    gap: 12
  }
}
```

## 8. DYNAMIC SAFE AREA

### Replace fixed 80px with dynamic calculation:

```typescript
// Safe area detection
function getBottomSafeArea(): number {
  // Check for iOS safe area
  const safeAreaBottom = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-bottom') || '0'
  );
  
  // Minimum buffer for mobile chrome
  const minBuffer = 60;
  
  // Add extra for iOS Safari bottom bar
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const safariBuffer = isIOS ? 100 : 80;
  
  return Math.max(safeAreaBottom + minBuffer, safariBuffer);
}

// Use in scenes:
const bottomSafeArea = isMobile ? getBottomSafeArea() : 60;
```

## 9. BUTTON SPECIFICATIONS

### Ensure consistent touch targets:

```typescript
BUTTON_SPECS = {
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
}

// Primary button (cyan): #00D9FF
// Secondary button (orange): #FFA500
// Disabled button: #4A4A4A with 0.5 opacity
```

## 10. TYPOGRAPHY SYSTEM

### Establish hierarchy:

```typescript
TYPOGRAPHY = {
  mobile: {
    h1: { size: '42px', weight: 'bold', lineHeight: 1.2 },    // Scene titles
    h2: { size: '32px', weight: 'bold', lineHeight: 1.3 },    // Sub-headers
    h3: { size: '24px', weight: '600', lineHeight: 1.3 },     // Card titles
    body: { size: '18px', weight: 'normal', lineHeight: 1.5 }, // Descriptions
    small: { size: '14px', weight: 'normal', lineHeight: 1.4 }, // Helper text
    score: { size: '32px', weight: 'bold', lineHeight: 1 }     // Numbers
  },
  desktop: {
    h1: { size: '56px', weight: 'bold', lineHeight: 1.2 },
    h2: { size: '42px', weight: 'bold', lineHeight: 1.3 },
    h3: { size: '28px', weight: '600', lineHeight: 1.3 },
    body: { size: '20px', weight: 'normal', lineHeight: 1.5 },
    small: { size: '16px', weight: 'normal', lineHeight: 1.4 },
    score: { size: '36px', weight: 'bold', lineHeight: 1 }
  }
}
```