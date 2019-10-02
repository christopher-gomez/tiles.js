export default class Animation {
  /**
   * Progress of the animation between 0.0 (start) and 1.0 (end).
   */
  public progress = 0.0;


  /**
   * Simple animation helper
   * @param durationMs duration of the animation in milliseconds
   * @param update animation function which will receive values between 0.0 and 1.0 over the duration of the animation
   * @param easingFunction function that determines the progression of the animation over time
   */
  constructor(private durationMs: number, private update: (progress: number) => void, private easingFunction = Animation.easeInOutQuad) {
  }

  /**
   * Advances the animation by the given amount of time in seconds.
   * Returns true if the animation is finished.
   */
  animate(dtS: number): boolean {
    this.progress = this.progress + dtS * 1000 / this.durationMs
    this.update(this.easingFunction(this.progress))
    return this.progress >= 1.0
  }

  static easeInOutQuad = (t: number): number => {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  static easeLinear = (t: number): number => t
}