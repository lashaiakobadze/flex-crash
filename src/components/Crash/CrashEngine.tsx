export enum CrashEngineState {
  Loading = "loading",
  Active = "active",
  Over = "over",
}

export class CrashEngine {
  public static CrashSpeed = 0.00006;
  public static PredictingLapse = 300;

  public startTime = 0;
  public elapsedTime = 0;
  public finalElapsed = 0;
  public finalMultiplier = 0;
  public crashPoint: number | null = null;
  public betAmount = 0;
  public graphWidth = 0;
  public graphHeight = 0;
  public plotWidth = 0;
  public plotHeight = 0;
  public plotOffsetX = 0;
  public plotOffsetY = 0;
  public xAxis = 0;
  public yAxis = 0;
  public xIncrement = 0;
  public yIncrement = 0;
  public xAxisMinimum = 1000;
  public yAxisMinimum = -1;
  public elapsedOffset = 0;
  public yAxisMultiplier = 1.5;
  public multiplier = 1;
  public tickTimeout: number | null = null;
  public lag = false;
  public lastGameTick: number | null = null;
  public lagTimeout: number | null = null;
  public state = CrashEngineState.Loading;
  public checkForLag = (() => {
    this.lag = true;
  }).bind(this);

  public onResize(width: number, height: number) {
    this.graphWidth = width;
    this.graphHeight = height;
    this.plotOffsetX = 50;
    this.plotOffsetY = 40;
    this.plotWidth = width - this.plotOffsetX;
    this.plotHeight = height - this.plotOffsetY;
  }

  public getMultiplierElapsed(multiplier: number) {
    return (
      100 *
      Math.ceil(
        Math.log(multiplier) / Math.log(Math.E) / CrashEngine.CrashSpeed / 100,
      )
    );
  }

  public getElapsedPayout(elapsedTime: number) {
    const payout =
      ~~(100 * Math.pow(Math.E, CrashEngine.CrashSpeed * elapsedTime)) / 100;
    if (!isFinite(payout)) {
      throw new Error("Infinite payout");
    }
    return Math.max(payout, 1);
  }

  public onGameTick(serverTick: number) {
    this.lastGameTick = Date.now();
    if (this.lag) {
      this.lag = false;
    }
    const lag = this.lastGameTick - serverTick;
    if (this.startTime > lag) {
      this.startTime = lag;
    }
    if (this.lagTimeout) {
      clearTimeout(this.lagTimeout);
    }

    this.lagTimeout = setTimeout(
      this.checkForLag,
      CrashEngine.PredictingLapse,
    ) as any as number;
  }

  public tick() {
    this.elapsedTime = this.getElapsedTime();
    this.multiplier =
      this.state !== CrashEngineState.Over
        ? this.getElapsedPayout(this.elapsedTime)
        : this.finalMultiplier;
    this.yAxisMinimum = this.yAxisMultiplier;
    this.xAxis = Math.max(
      this.elapsedTime + this.elapsedOffset,
      this.xAxisMinimum,
    );
    this.yAxis = Math.max(this.multiplier, this.yAxisMinimum);
    this.xIncrement = this.plotWidth / this.xAxis;
    this.yIncrement = this.plotHeight / this.yAxis;
  }

  public destroy() {
    if (this.tickTimeout) {
      clearTimeout(this.tickTimeout);
    }

    if (this.lagTimeout) {
      clearTimeout(this.lagTimeout);
    }
  }

  public getElapsedTime() {
    if (this.state === CrashEngineState.Over) {
      return this.finalElapsed;
    }

    if (this.state !== CrashEngineState.Active) {
      return 0;
    }

    return Date.now() - this.startTime;
  }

  public getElapsedPosition(elapsedTime: number) {
    const elapsedPayout = this.getElapsedPayout(elapsedTime) - 1;
    return {
      x: elapsedTime * this.xIncrement,
      y: this.plotHeight - elapsedPayout * this.yIncrement,
    };
  }

  public getYMultiplier(yPosition: number) {
    return (
      Math.ceil(
        1000 * (this.yAxis - (yPosition / this.plotHeight) * this.yAxis + 1),
      ) / 1000
    );
  }

  public getMultiplierY(multiplier: number) {
    return this.plotHeight - (multiplier - 1) * this.yIncrement;
  }
}
