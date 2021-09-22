import Animation from './Animation';
import { Renderer, Camera, Scene } from 'three';

export default class AnimationManager {
  public animations: Animation[] = [];

  private _lastTimestamp = performance.now();
  private _animationID: number;
  private _onAnimate: { [id: string]: (dts: number) => void } = {};
  private _paused = false;

  constructor(private renderer: Renderer, private container: Scene, private camera: Camera, onAnimate?: (dtS: number) => void) {
    const _onAnimate = (dtS: number): void => {
      for(let i = 0; i < this.animations.length; i++) {
        // advance the animation
        const animation = this.animations[i]
        if (animation) {
          const finished = animation.animate(dtS)
          // if the animation is finished (returned true) remove it
          if (finished) {
            // remove the animation
			this.animations.shift();
          }
        }
      }
	}
	this._onAnimate[this.genID()] = _onAnimate;
    if (onAnimate) {
      this._onAnimate[this.genID()] = onAnimate;
    }
  }

  set paused(paused: boolean) {
    this._paused = paused;
  }

  addOnAnimate(callback: (dtS: number) => void): string {
    const id = this.genID();
    this._onAnimate[id] = callback;
    return id;
  }

  addAnimation(animation: Animation): void {
    if (this.animations.length > 0) {
      this.cancelAnimation();
    }
    this.animations.push(animation);
  }

  cancelOnAnimate(id: string): void {
    delete this._onAnimate[id];
  }

  cancelAnimation(): void {
    this.animations.shift();
  }

  dispose(): void {
    window.cancelAnimationFrame(this._animationID);
    this.animations = null;
  }

  animate(timestamp: number): void {
    if (!this._paused) {
      const dtS = (timestamp - this._lastTimestamp) / 1000.0;
      this._lastTimestamp = timestamp;
      for (const i in this._onAnimate) {
        this._onAnimate[i](dtS);
      }
    }
    this.renderer.render(this.container, this.camera);
    this._animationID = requestAnimationFrame(this.animate.bind(this));
  }
  
  toggleAnimationLoop(): void {
    this._paused = !this._paused;
  }

  private genID(): string {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
  };
}