export type Position = 'Keeper' | 'Defender' | 'Mid' | 'Striker';

export interface Player {
  name: string;
  position: Position;
  dp: number;
  defending: number;
  shooting: number;
  pace: number;
  notes?: string;
}

export interface PlayerWithScore extends Player {
  ovr: number;
  composite: number;
  isCaptain?: boolean;
}

export interface WeightAdjustment {
  playerName: string;
  tab: string;
  attribute: 'dp' | 'defending' | 'shooting' | 'pace';
  modifier: number;
  reason: string;
  dateAdded: string;
}

export interface Team {
  name: string;
  players: PlayerWithScore[];
  meanOvr: number;
  stdDevOvr: number;
  totalComposite: number;
}

export interface GenerateResult {
  teamA: Team;
  teamB: Team;
  balance: {
    meanDiff: number;
    stdDiff: number;
    compositeDiff: number;
    swapsPerformed: number;
    passed: boolean;
  };
}

export interface GameRecord {
  date: string;
  tab: string;
  teamA: string[];
  teamB: string[];
  result: string;
  notes: string;
}

export interface OfficialTeams {
  teamA: string[];
  teamB: string[];
  generatedAt: string;
  locked?: boolean;
}

export interface PendingPostgame {
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  notes: string;
  submittedAt: string;
}
