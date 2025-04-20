export interface Round {
  r: number; // Round ID
  p: string; // Points (as string to preserve precision)
  s: number; // Status (0=upcoming, 1=current, 4=finished, 5=canceled)
}

export enum RoundStatus {
  UPCOMING = 0,
  CURRENT = 1,
  FINISHED = 4,
  CANCELED = 5,
}

export interface RoundHistory {
  rounds: Round[];
  currentRoundId?: number;
}
