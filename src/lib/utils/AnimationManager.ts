import Animation from './Animation';
import { Renderer, Camera, Scene } from 'three';

export default class AnimationManager {

  private _animationDict: { cur: number, animations: Animation[] } = { cur: 0, animations: [] }

  private _lastTimestamp = performance.now();
  private _animationID: number;
  private _onAnimate: { [id: string]: (dts: number) => void } = {};
  private _animationsUpdateID: string;
  private _paused = false;

  constructor(private renderer: Renderer, private container: Scene, private camera: Camera, onAnimate?: (dtS: number) => void) {
    this.animationQueues = {};
    this._animationsUpdateID = this.genID();
    this._onAnimate[this._animationsUpdateID] = this.updateAnims.bind(this);


    if (onAnimate) {
      this._onAnimate[this.genID()] = onAnimate.bind(this);
    }

    this._animate(0);
  }

  private updateAnims(dtS: number) {
    let curAnim = 0;
    // for (let i = 0; i < this.animations.length; i++) {

    // advance the animation

    if (this._animationDict.animations.length > 0) {
      let animation = this._animationDict.animations[curAnim];

      while (curAnim < this._animationDict.animations.length && animation && (animation.complete || animation.paused)) {
        // this._animationDict.shift();
        // if (this._animationDict.length > 0) animation = this._animationDict[0];
        // else animation = null;
        curAnim++;
        animation = this._animationDict.animations[curAnim];
      }

      if (animation && !animation.paused && !animation.complete) {
        this._animationDict.cur = curAnim;
        const finished = animation.animate(dtS)
        // if the animation is finished (returned true) remove it
        if (finished) {
          // remove the animation
          // this._animationDict.shift();
          for (let i = 0; i < this._animationDict.animations.length; i++) {
            if (!this._animationDict.animations[i].complete || this._animationDict.animations[i].paused) {
              this._animationDict.cur = i;
              break;
            }
          }
        }
      }
    }

    for (let queue in this.animationQueues) {
      let cur = 0;
      if (this.animationQueues[queue].animations.length > 0) {
        let anim = this.animationQueues[queue].animations[cur];

        // updating anim queue: '+queue);
        // anim index: '+cur+"\ncomplete?: "+anim.complete+"\npaused?: "+anim.paused);

        while (cur < this.animationQueues[queue].animations.length && anim && (anim.paused || anim.complete)) {
          cur++;
          anim = this.animationQueues[queue].animations[cur];

          if(cur < this.animationQueues[queue].animations.length && anim) {
            // anim index: '+cur+"\ncomplete?: "+anim.complete+"\npaused?: "+anim.paused);
          }
        }

        if (anim && !anim.paused && !anim.complete) {
          // anim index: '+cur+"\ncomplete?: "+anim.complete+"\npaused?: "+anim.paused);
          this.animationQueues[queue].cur = cur;

          const done = anim.animate(dtS);
          if (done) {
            // this.animationQueues[queue].shift();
            // anim index; '+cur+" COMPLETE");
            for (let i = 0; i < this.animationQueues[queue].animations.length; i++) {
              if (!this.animationQueues[queue].animations[i].complete || this.animationQueues[queue].animations[i].paused) {
                this.animationQueues[queue].cur = i;
                break;
              }
            }
          }
        } else {
          // queue: '+queue+" has no more anims to update");
        }
      }
    }
    // }
  }

  set paused(paused: boolean) {
    this._paused = paused;
  }

  addOnAnimate(callback: (dtS: number) => void): string {
    const id = this.genID();
    this._onAnimate[id] = callback;
    return id;
  }

  animationQueues: { [key: string]: { cur: number, animations: Animation[] } }

  addAnimation(animation: Animation, animationQueue = null, cancelCur: boolean = false): Animation {

    // cancelAnimationFrame(this._animationID);
    // this.cancelOnAnimate(this._animationsUpdateID);

    if (cancelCur) this.stopAnimation(animationQueue);

    if (!animationQueue)
      this._animationDict.animations.push(animation);
    else
      this.addtoQueue(animationQueue, animation);

    this._onAnimate[this._animationsUpdateID] = this.updateAnims.bind(this);
    // this._animate(this._lastTimestamp);

    return animation;
  }

  private addtoQueue(name, animation) {
    if (!this.animationQueues[name]) this.animationQueues[name] = { cur: 0, animations: [] };
    this.animationQueues[name].animations.push(animation);
    // pushed new anim to queue: '+name+"\ntotal anims in queue: "+this.animationQueues[name].animations.length);
  }

  getCurAnimInQueue(name): Animation {
    if (this.animationQueues[name]) return this.animationQueues[name].animations[this.animationQueues[name].cur];
    else return null;
  }

  cancelOnAnimate(id: string): void {
    delete this._onAnimate[id];
  }

  stopAnimation(animationQueue: string = null, cancel: boolean = true): void {
    if (!animationQueue) {
      if (this._animationDict.animations.length > 0) {
        for (let i = 0; i <= this._animationDict.cur; i++) {
          this._animationDict.animations[i].stop(cancel);
        }
      }
      // this._animationDict.animations.shift();
    }
    else {
      if (this.animationQueues[animationQueue]) {
        if (this.animationQueues[animationQueue].animations.length > 0) {
          for (let i = 0; i <= this.animationQueues[animationQueue].cur; i++) {
            this.animationQueues[animationQueue].animations[i].stop(cancel);
          }
        }
        // this.animationQueues[animationQueue].animations.shift();
      }
    }
  }

  dispose(): void {
    window.cancelAnimationFrame(this._animationID);
    this._animationDict = null;
  }



  private _animate(timestamp: number): void {
    if (!this._paused) {
      const dtS = (timestamp - this._lastTimestamp) / 1000.0;
      this._lastTimestamp = timestamp;
      for (const i in this._onAnimate) {
        this._onAnimate[i](dtS);
      }
    }

    this.renderer.render(this.container, this.camera);
    this._animationID = requestAnimationFrame(this._animate.bind(this));
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