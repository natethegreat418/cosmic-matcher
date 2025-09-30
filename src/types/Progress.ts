export interface GameProgress {
  currentRound: number;           // 1-10
  totalScore: number;             // Sum of all round scores
  roundScores: number[];          // Individual round scores
  availablePoints: number;        // Points available for shop
  spentPoints: number;            // Points spent on upgrades
  ownedUpgrades: string[];        // Active upgrade IDs
  roundTimer: number;             // Always 60, but speed changes
  isComplete: boolean;            // Has player finished all 10 rounds
}

export interface RoundResult {
  roundNumber: number;
  score: number;
  timeRemaining: number;
  combosAchieved: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxPurchases: number;
  purchaseCount: number;
  icon?: string; // Optional icon path
}

export interface PurchaseResult {
  success: boolean;
  message: string;
}