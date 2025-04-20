export interface IBet {
  c: string;
  t: number;
  u: number;
  n: string;
  a: number;
}

export class Bet {
  amount: number;
  currency: string;
  nickname: string;
  time: number;
  userId: number;
  status?: string = "pending";
  points?: number = 0;
  roundId?: number = 0;

  constructor(
    a: number,
    c: string,
    n: string,
    t: number,
    u: number,
    status: string = "pending",
    p: number = 0,
    roundId: number = 0
  ) {
    this.amount = a;
    this.currency = c;
    this.nickname = n;
    this.time = t;
    this.userId = u;
    this.status = status;
    this.points = p;
    this.roundId = roundId;
  }
}
