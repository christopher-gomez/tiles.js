export default class Animation {
  /**
   * Progress of the animation between 0.0 (start) and 1.0 (end).
   */
  public progress = 0.0;

  public complete = false;
  public paused = false;

  private updateArgs: { [updateArg: string]: any }

  /**
   * Simple animation helper
   * @param durationMs duration of the animation in milliseconds
   * @param update animation function which will receive values between 0.0 and 1.0 over the duration of the animation
   * @param easingFunction function that determines the progression of the animation over time
   */
  constructor(
    public durationMs: number,
    private update: (progress: number, args?: { [updateArg: string]: any }) => void,
    private onAnimationStart: () => { [updateArg: string]: any } | void = undefined,
    private onAnimationComplete: () => void = undefined,
    private onAnimationCanceled: () => void = undefined,
    private easingFunction = Animation.easeLinear) {
  }

  public set ease(easingFunction: (t: number) => number) {
    this.easingFunction = easingFunction;
  }

  /**
   * Advances the animation by the given amount of time in seconds.
   * Returns true if the animation is finished.
   */
  animate(dtS: number): boolean {
    if (this.complete) return true;

    if (this.progress === 0) {
      if (this.onAnimationStart) {
        this.updateArgs = this.onAnimationStart() || {}; // Initialize as empty object if onAnimationStart returns void
      } this.onAnimationStart = undefined;
    }

    this.progress = this.progress + dtS * 1000 / this.durationMs

    this.update(this.easingFunction(this.progress), this.updateArgs)

    if (this.progress >= 1.0) {
      this.complete = true;
      if (this.onAnimationComplete) this.onAnimationComplete();
    }

    return this.complete
  }

  stop(cancel: boolean = true) {
    if (this.complete) return;

    this.complete = true;

    if (!cancel && this.onAnimationComplete !== undefined)
      this.onAnimationComplete();

    this.onAnimationComplete = null;

    if (cancel && this.onAnimationCanceled !== undefined) this.onAnimationCanceled();

    this.onAnimationCanceled = null;
  }

  static easeInOutQuad = (t: number): number => {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  static easeInOutCubic = (t: number): number => {
    t = Math.max(0, Math.min(1, t));
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeInOut = (t): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  static easeOutQuad = (t) => {
    return 1 - (1 - t) * (1 - t);
  }

  static easeOutExpo = (t) => {
    return 1 - Math.pow(2, -10 * t);
  }

  static easeInQuad = (t) => {
    return t * t;
  }

  static easeLinear = (t: number): number => t
}