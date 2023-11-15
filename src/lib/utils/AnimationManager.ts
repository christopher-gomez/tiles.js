import Animation from "./Animation";
import { Renderer, Camera, Scene, Clock, PerspectiveCamera } from "three";
import ResizeObserver from "resize-observer-polyfill";

interface AnimationDict {
  cur: number;
  animations: Animation[];
}

interface AnimationQueue {
  cur: number;
  animations: Animation[];
}

export default class AnimationManager {
  private _animationDict: AnimationDict = { cur: 0, animations: [] };
  private _lastTimestamp = performance.now();
  private _animationID: number;
  private _onAnimate: Map<string, (dtS: number) => void> = new Map();
  private _animationsUpdateID: string;
  private _paused = false;
  private _clock = new Clock();
  private _observed: HTMLElement;
  private _observer: ResizeObserver;

  constructor(
    private renderer?: Renderer,
    private container?: Scene,
    private camera?: Camera,
    onAnimate?: (dtS: number) => void,
    public render: boolean = true,
    private observeElementResize = false
  ) {
    this._animationsUpdateID = this.genID();
    this._onAnimate.set(this._animationsUpdateID, this.updateAnims.bind(this));

    if (onAnimate) {
      this._onAnimate.set(this.genID(), onAnimate);
    }

    if (this.observeElementResize) {
      if (this._observer) {
        this._observer.unobserve(this._observed);
      } else {
        this._observer = new ResizeObserver(this.onWindowResize.bind(this));
      }

      let el: HTMLElement = this.renderer.domElement;
      let nextEl: HTMLElement = el;

      while (nextEl) {
        nextEl = nextEl.parentElement;

        if (nextEl) el = nextEl;
      }

      this._observed = el;
      this._observer.observe(this._observed);
    }

    this._clock.start();
    this._animate(0);
  }

  private _resizeID: number;
  private onWindowResize(): void {
    window.clearTimeout(this._resizeID);

    this.setAnimationLoopPaused(true);
    let bound = this.renderer.domElement.parentElement
      ? this.renderer.domElement.parentElement.getBoundingClientRect()
      : this.renderer.domElement.getBoundingClientRect();

    if (this.camera != null) {
      (this.camera as PerspectiveCamera).aspect = bound.width / bound.height;
      (this.camera as PerspectiveCamera).updateProjectionMatrix();
    }
    this.renderer?.setSize(bound.width, bound.height, true);

    this._resizeID = window.setTimeout(() => {
      this?.setAnimationLoopPaused(false);
    }, 100);
  }

  private _animationRunning: { [queue: string]: boolean } = {}; // Track running animations for each queue

  private updateAnims(dtS: number) {
    if (this._animationDict.animations.length > 0) {
      let foundNextValid = false;
      let animation = this._animationDict.animations[0];
      while (!foundNextValid && animation !== null) {
        if (animation.complete) {
          this._animationDict.animations.splice(0, 1);
          if (this._animationDict.animations.length > 0)
            animation = this._animationDict.animations[0];
          else animation = null;
        } else if (animation.paused) {
          animation = null;
          break;
        } else {
          foundNextValid = true;
        }
      }

      if (animation !== null) {
        animation.animate(dtS);
      }
    }

    for (const queue in this.animationQueues) {
      const animationQueue = this.animationQueues[queue];

      if (animationQueue.animations.length === 0) continue;

      let queueAnim = animationQueue.animations[0];
      let foundNextValid = false;

      while (!foundNextValid && queueAnim !== null) {
        if (queueAnim.complete) {
          animationQueue.animations.splice(0, 1);

          if (animationQueue.animations.length > 0)
            queueAnim = animationQueue.animations[0];
          else queueAnim = null;
        } else if (queueAnim.paused) {
          queueAnim = null;
          break;
        } else {
          foundNextValid = true;
        }
      }

      if (queueAnim) queueAnim.animate(dtS);
    }
  }

  set paused(paused: boolean) {
    this._paused = paused;
  }

  addOnAnimateListener(callback: (dtS: number) => void): string {
    const id = this.genID();
    this._onAnimate.set(id, callback.bind(this));
    return id;
  }

  animationQueues: { [key: string]: AnimationQueue } = {};

  addAnimation(
    animation: Animation,
    animationQueue: string = null,
    cancelCur: boolean = false
  ): Animation {
    if (cancelCur) {
      this.stopAnimation(animationQueue);
    }

    if (!animationQueue) {
      this._animationDict.animations.push(animation);
    } else {
      this.addtoQueue(animationQueue, animation);
    }

    this._onAnimate.set(this._animationsUpdateID, this.updateAnims.bind(this));

    return animation;
  }

  private addtoQueue(name: string, animation: Animation) {
    if (!this.animationQueues[name]) {
      this.animationQueues[name] = { cur: 0, animations: [] };
    }
    this.animationQueues[name].animations.push(animation);
  }

  getCurAnimInQueue(name: string): Animation {
    const animationQueue = this.animationQueues[name];
    if (animationQueue) {
      return animationQueue.animations[animationQueue.cur];
    }
    return null;
  }

  clearAnimQueue(name: string) {
    const animationQueue = this.animationQueues[name];
    if (animationQueue) {
      animationQueue.animations[animationQueue.cur].stop();
      delete this.animationQueues[name];
    }
  }

  removeOnAnimateListener(id: string): void {
    if (!id) return;

    this._onAnimate.delete(id);
  }

  clearOnAnimateListeners(): void {
    this._onAnimate.clear();
  }

  stopAnimation(
    animationQueue: string = null,
    cancel: boolean = true
  ): boolean {
    let stopped = false;

    if (!animationQueue) {
      if (
        this._animationDict.animations.length > 0 &&
        this._animationDict.cur < this._animationDict.animations.length
      ) {
        for (let i = this._animationDict.cur; i >= 0; i--) {
          const animation = this._animationDict.animations[i];
          if (animation) {
            animation.stop(cancel);
            stopped = true;
          }
        }
        this._animationDict.animations.length = 0;
        this._animationDict.cur = 0;
      }
    } else {
      if (this.animationQueues[animationQueue]) {
        const queue = this.animationQueues[animationQueue];
        if (
          queue.animations.length > 0 &&
          queue.cur < queue.animations.length
        ) {
          for (let i = queue.cur; i >= 0; i--) {
            const animation = queue.animations[i];
            if (animation) {
              animation.stop(cancel);
              stopped = true;
            }
          }
        }
        queue.animations.length = 0;
        queue.cur = 0;
      }
    }

    return stopped;
  }

  dispose(): void {
    this.paused = true;
    window.cancelAnimationFrame(this._animationID);
    this._animationDict = null;

    if (this.observeElementResize) {
      if (this._observer) this._observer.disconnect();
    }
  }

  private _desiredFPS: number = 60; // Set your desired frame rate here
  private _frameDuration: number = 1000 / this._desiredFPS;
  private _lastFrameTime: number = 0;

  private _animate(timestamp: number): void {
    if (!this._paused) {
      // Calculate the time elapsed since the last frame
      const dtS = (timestamp - this._lastTimestamp) / 1000.0;

      // Check if enough time has passed since the last frame
      const timeSinceLastFrame = timestamp - this._lastFrameTime;
      if (timeSinceLastFrame >= this._frameDuration) {
        // Update lastTimestamp only when rendering happens
        this._lastTimestamp = timestamp;

        // Render the frame and update the last frame time
        if (this.render && this.renderer && this.container && this.camera) {
          this.renderer.render(this.container, this.camera);
        }

        this._onAnimate.forEach((callback) => {
          callback(dtS);
        });

        this._lastFrameTime = timestamp;
      }
    }

    this._animationID = requestAnimationFrame(this._animate.bind(this));
  }

  toggleAnimationLoop(): void {
    this._paused = !this._paused;
  }

  setAnimationLoopPaused(paused: boolean) {
    this._paused = paused;
  }

  private genID(): string {
    return "_" + Math.random().toString(36).substr(2, 9);
  }
}
