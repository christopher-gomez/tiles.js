export default class Animation {
  /**
   * Progress of the animation between 0.0 (start) and 1.0 (end).
   */
  public progress = 0.0;

  public complete = false;
  public paused = false;

  /**
   * Simple animation helper
   * @param durationMs duration of the animation in milliseconds
   * @param update animation function which will receive values between 0.0 and 1.0 over the duration of the animation
   * @param easingFunction function that determines the progression of the animation over time
   */
  constructor(public durationMs: number,
    private update: (progress: number) => void,
    private onAnimationStart: () => void = undefined,
    private onAnimationComplete: () => void = undefined,
    private onAnimationCanceled: () => void = undefined,
    private easingFunction = Animation.easeLinear) {
  }

  /**
   * Advances the animation by the given amount of time in seconds.
   * Returns true if the animation is finished.
   */
  animate(dtS: number): boolean {
    if (this.complete) return true;

    if (this.progress === 0) {
      if (this.onAnimationStart) this.onAnimationStart();
      this.onAnimationStart = undefined;
    }

    this.progress = this.progress + dtS * 1000 / this.durationMs

    this.update(this.easingFunction(this.progress))

    if (this.progress >= 1.0) {
      this.complete = true;
      if (this.onAnimationComplete) this.onAnimationComplete();
    }

    return this.complete
  }

  stop(cancel: boolean = true) {
    if (this.complete) return;

    this.complete = true;

    if (!cancel && this.onAnimationComplete)
      this.onAnimationComplete();

    this.onAnimationComplete = null;

    if (cancel && this.onAnimationCanceled) this.onAnimationCanceled();
  }

  static easeInOutQuad = (t: number): number => {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  static easeLinear = (t: number): number => t
}