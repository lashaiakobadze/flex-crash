export interface IWin {
  a: number;
  c: string;
  n: string;
  p: number;
  t: number;
  u: number;
}

export class Win {
  amount: number;
    currency: string;
    point: number;
  nickname: string;
  time: number;
  userId: number;

  constructor(a: number, c: string, n: string, p: number, t: number, u: number) {
    this.amount =a;
    this.currency =c;
    this.point =p;
    this.nickname =n;
    this.time =t;
    this.userId =u;
  }
}

export class WinState {
    currentWin: Win | null;
    previousWin: Win | null;


}