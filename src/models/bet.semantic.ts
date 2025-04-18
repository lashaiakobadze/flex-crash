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

  constructor(a: number, c: string, n: string, t: number, u: number) {
    this.amount = a;
    this.currency = c;
    this.nickname = n;
    this.time = t;
    this.userId = u;
  }
}
