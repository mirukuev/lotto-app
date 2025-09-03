export interface Draw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

export interface ApiError {
  error: string;
}