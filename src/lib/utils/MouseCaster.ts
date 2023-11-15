import Engine from "../Engine";
import * as THREE from "three";
import Tile from "../map/Tile";
import {
  Intersection,
  Vector3,
  Vector2,
  Camera,
  Raycaster,
  Object3D,
  Sprite,
} from "three";
import Signal from "../lib/Signal";
import View from "../scene/View";
import Controller from "../scene/Controller";
import MeshEntity from "../env/MeshEntity";
import MeshText from "../env/MeshText";
import { isEntity } from "../env/Entity";
/*
	Translates mouse interactivity into 3D positions, so we can easily pick objects in the scene.

	Like everything else in ThreeJS, ray casting creates a ton of new objects each time it's used. This contributes to frequent garbage collections (causing frame hitches), so if you're limited to low-end hardware like mobile, it would be better to only update it when the user clicks, instead of every frame (so no hover effects, but on mobile those don't work anyway). You'll want to create a version that handles touch anyway.

	group - any Object3D (Scene, Group, Mesh, Sprite, etc) that the mouse will cast against
	camera - the camera to cast from
	[element] - optional element to attach mouse event to

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */

export enum InputType {
  MOUSE_OVER = "MOUSE_OVER",
  MOUSE_OUT = "MOUSE_OUT",
  LEFT_DOWN = "LEFT_DOWN",
  LEFT_UP = "LEFT_UP",
  RIGHT_DOWN = "RIGHT_DOWN",
  RIGHT_UP = "RIGHT_UP",
  LEFT_CLICK = "LEFT_CLICK", // only fires if the user clicked down and up while on the same object
  RIGHT_CLICK = "RIGHT_CLICK",
  WHEEL_CLICK = "WHEEL_CLICK",
  WHEEL_SCROLL = "WHEEL_SCROLL",
  WHEEL_DOWN = "WHEEL_DOWN",
  WHEEL_UP = "WHEEL_UP",
  MOUSE_MOVE = "MOUSE_MOVE",
}

class MouseCaster {
  public leftDown: boolean;
  public rightDown: boolean;
  public wheelDown: boolean;
  public selectedObject: any;
  public allHits: Intersection[];
  public active: boolean;
  public shift: boolean;
  public ctrl: boolean;
  public wheel: number;

  public position: Vector3;
  public screenPosition: Vector2;
  public signal: Signal;
  public group: Object3D;

  private _camera: Camera;
  private _raycaster: Raycaster;
  private _preventDefault: boolean;
  public element: HTMLElement | Document;

  constructor(
    group: Object3D,
    camera: Camera,
    element: HTMLElement,
    public controls: Controller
  ) {
    this.leftDown = false; // left click
    this.rightDown = false;
    // // the object that was just clicked on
    // this.pickedObject = null;
    // the object currently being 'held'
    this.selectedObject = null;
    // store the results of the last cast
    this.allHits = null;
    // disable the caster easily to temporarily prevent user input
    this.active = true;

    this.shift = false;
    this.ctrl = false;
    this.wheel = 0;

    // you can track exactly where the mouse is in the 3D scene by using the z component
    this.position = new THREE.Vector3();
    this.signal = new Engine.Signal();
    this.group = group;

    // behind-the-scenes stuff you shouldn't worry about
    this._camera = camera;
    this._raycaster = new THREE.Raycaster();
    this._preventDefault = false;

    this.element = element || document.documentElement;

    document.documentElement.addEventListener(
      "mousemove",
      this._onDocumentMouseMove.bind(this),
      false
    );
    document.documentElement.addEventListener(
      "mousedown",
      this._onDocumentMouseDown.bind(this),
      false
    );
    document.documentElement.addEventListener(
      "mouseup",
      this._onDocumentMouseUp.bind(this),
      false
    );
    document.documentElement.addEventListener(
      "mousewheel",
      this._onMouseWheel.bind(this),
      false
    );
    document.documentElement.addEventListener(
      "DOMMouseScroll",
      this._onMouseWheel.bind(this),
      false
    ); // firefox
    document.documentElement.addEventListener(
      "touchstart",
      this._onTouchStart.bind(this),
      false
    );
    document.documentElement.addEventListener(
      "touchmove",
      this._onTouchMove.bind(this),
      false
    );
    document.documentElement.addEventListener(
      "touchend",
      this._onTouchEnd.bind(this),
      false
    );
  }

  _onTouchStart(e) {
    this._onDocumentMouseDown((e as TouchEvent).touches[0]);
  }

  _onTouchMove(event: TouchEvent) {
    var touches = event.changedTouches,
      first = touches[0],
      type = "";
    switch (event.type) {
      case "touchstart":
        type = "mousedown";
        break;
      case "touchmove":
        type = "mousemove";
        break;
      case "touchend":
        type = "mouseup";
        break;
      default:
        return;
    }
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(
      type,
      true,
      true,
      window,
      1,
      first.screenX,
      first.screenY,
      first.clientX,
      first.clientY,
      false,
      false,
      false,
      false,
      0 /*left*/,
      null
    );

    first.target.dispatchEvent(simulatedEvent);

    this._onDocumentMouseMove(simulatedEvent);
  }

  _onTouchEnd(e) {
    this._onDocumentMouseUp(
      (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0]
    );
  }

  dispose(ctx: any) {
    this.signal.removeAll(ctx);
    this.element.removeEventListener(
      "mousemove",
      this._onDocumentMouseMove,
      false
    );
    this.element.removeEventListener("touchmove", this._onTouchMove, false);
    this.element.removeEventListener(
      "mousedown",
      this._onDocumentMouseDown,
      false
    );
    this.element.removeEventListener("touchstart", this._onTouchStart, false);
    this.element.removeEventListener("mouseup", this._onDocumentMouseUp, false);
    this.element.removeEventListener("touchend", this._onTouchEnd, false);
    this.element.removeEventListener("mousewheel", this._onMouseWheel, false);
    this.element.removeEventListener(
      "DOMMouseScroll",
      this._onMouseWheel,
      false
    ); // firefox

    document.documentElement.removeEventListener(
      "mousemove",
      this._onDocumentMouseMove,
      false
    );
    document.documentElement.removeEventListener(
      "touchmove",
      this._onTouchMove,
      false
    );
    document.documentElement.removeEventListener(
      "mousedown",
      this._onDocumentMouseDown,
      false
    );
    document.documentElement.removeEventListener(
      "touchstart",
      this._onTouchStart,
      false
    );
    document.documentElement.removeEventListener(
      "mouseup",
      this._onDocumentMouseUp,
      false
    );
    document.documentElement.removeEventListener(
      "touchend",
      this._onTouchEnd,
      false
    );
    document.documentElement.removeEventListener(
      "mousewheel",
      this._onMouseWheel,
      false
    );
    document.documentElement.removeEventListener(
      "DOMMouseScroll",
      this._onMouseWheel,
      false
    ); // firefox

    this.signal.dispose();

    this.signal = undefined;
  }

  // private _collisionObjects: { topObject: any, [name: string]: any } = { topObject: null };

  public raycastObject;

  castForValidObj() {
    const intersects = this.rayCast();
    let hit: THREE.Intersection, obj;
    if (intersects.length > 0) {
      hit = intersects.find(
        (i) =>
          (i.object.userData?.structure &&
            ((isEntity(i.object?.userData?.structure) &&
              !i.object?.userData.structure.ignoreRay) ||
              (i.object?.userData?.structure instanceof Tile &&
                !i.object?.userData?.structure.getCustomData()[
                  "ignoreRay"
                ]))) ||
          (i.object instanceof Sprite && !i.object?.userData?.ignoreRay)
      );
    }

    if (hit) {
      if (
        hit.object?.userData?.structure &&
        isEntity(hit.object.userData.structure)
      ) {
        if (hit.object?.userData?.structure?.ignoreRay) {
          return { intersects, obj: null, hit };
        }
      }

      if (hit.object && hit.object.userData.structure instanceof MeshText) {
        return { intersects, obj: null, hit };
      }

      obj = hit.object.userData.structure;

      return { intersects, obj, hit };
    }

    return { intersects, obj: null, hit: null };
  }

  update() {
    // if(this.controls.panning) return;
    if (!this.active || !this.screenPosition || !this.signal) {
      return;
    }

    const { intersects, obj, hit } = this.castForValidObj();

    if (hit != null && obj !== null) {
      // this.position.copy(hit.point);

      // get the first object under the mouse

      this.position.copy(hit.point);

      // if (hit.object instanceof Sprite)
      // 	obj = hit.object;
      // else
      // obj = hit.object.userData.structure;

      // if (cur !== 0 && obj !== undefined) prevIntersects.push(obj.constructor.name);

      // if (obj && prevIntersects.length > 0 && prevIntersects.includes(obj.constructor.name)) {
      // 	cur++;
      // 	continue;
      // }

      // if (obj !== undefined) {
      // 	curHits.push(obj.constructor.name);
      // }

      // if (obj !== undefined && !(obj.constructor.name in this._collisionObjects)) {
      // 	this._collisionObjects[obj.constructor.name] = undefined;
      // }

      if (obj !== undefined && this.raycastObject !== obj) {
        // the first object changed, meaning there's a different one, or none at all
        if (this.raycastObject) {
          // it's a new object, notify the old object is going away
          this.signal.dispatch(InputType.MOUSE_OUT, {
            data: this.raycastObject,
          });
        }

        // if (cur === 0) {
        this.raycastObject = obj;

        // if (hits === 0) {
        this.selectedObject = null;
        // this._collisionObjects.topObject = obj;
        // }
        // }

        this.signal.dispatch(InputType.MOUSE_OVER, {
          data: obj,
          mousePos: this.position,
        });

        if (this.rightDown)
          this.signal.dispatch(InputType.RIGHT_DOWN, {
            data: obj,
            mousePos: this.position,
          });
        if (this.leftDown)
          this.signal.dispatch(InputType.LEFT_DOWN, {
            data: obj,
            mousePos: this.position,
          });
        if (this.wheelDown)
          this.signal.dispatch(InputType.WHEEL_DOWN, {
            data: obj,
            mousePos: this.position,
          });

        // hits++;
      }

      // cur++;
      // }

      // if (Object.keys(prevHits).length > 1) {
      // 	for (const key in prevHits) {
      // 		if (key === 'topObject') continue;

      // 		if (!(curHits.includes(key))) {
      // 			if (this._collisionObjects[key]) {
      // 				if (this._collisionObjects[obj] !== null) {
      // 					this.signal.dispatch(InputType.MOUSE_OUT, { data: this._collisionObjects[key] });
      // 					this._collisionObjects[key] = null;
      // 				}
      // 			}
      // 		}
      // 	}
      // }
    } else {
      // there isn't anything under the mouse
      // if (this.pickedObject) {
      // there was though, we just moved out
      // for (const obj in this._collisionObjects) {
      // if (obj === 'topObject') continue;

      if (this.raycastObject) {
        this.signal.dispatch(InputType.MOUSE_OUT, {
          data: this.raycastObject,
        });
        this.raycastObject = null;
      }
      // }
      // this.pickedObject = null;
      this.selectedObject = null;
    }

    this.allHits = intersects;
  }

  preventDefault() {
    this._preventDefault = true;
  }

  private _onDocumentMouseDown(evt: any) {
    if (!this.signal) return;

    this.onMouseDown(evt);
  }

  public onMouseDown(evt) {
    if (!this.signal) return;

    // if (evt instanceof MouseEvent)
    // 	evt.preventDefault();

    // if (this._preventDefault) {
    // 	this._preventDefault = false;
    // 	return false;
    // }

    if (this.raycastObject) {
      this.selectedObject = this.raycastObject;
    }

    if (evt instanceof MouseEvent) {
      this.shift = evt.shiftKey;
      this.ctrl = evt.ctrlKey;

      this.leftDown = evt.button === 0;
      this.wheelDown = evt.button === 1;
      this.rightDown = evt.button === 2;
    }

    if (this.leftDown) {
      this.signal.dispatch(InputType.LEFT_DOWN, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }

    if (this.wheelDown) {
      this.signal.dispatch(InputType.WHEEL_DOWN, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }

    if (this.rightDown) {
      this.signal.dispatch(InputType.RIGHT_DOWN, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }
  }

  private _onDocumentMouseUp(evt: any) {
    this.onMouseUp(evt);
  }

  public onMouseUp(evt: any) {
    if (!this.signal) return;

    // evt.preventDefault();

    // if (this._preventDefault) {
    // 	this._preventDefault = false;
    // 	return false;
    // }

    if (this.controls.panning) return;

    const wasLeftDown = this.leftDown;
    const wasWheelDown = this.wheelDown;
    const wasRightDown = this.rightDown;

    if (evt instanceof MouseEvent) {
      this.shift = evt.shiftKey;
      this.ctrl = evt.ctrlKey;

      this.leftDown = evt.button === 0 ? false : this.leftDown;
      this.wheelDown = evt.button === 1 ? false : this.wheelDown;
      this.rightDown = evt.button === 2 ? false : this.rightDown;
    }

    if (wasLeftDown && !this.leftDown) {
      this.signal.dispatch(InputType.LEFT_UP, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }

    if (wasRightDown && !this.rightDown) {
      this.signal.dispatch(InputType.RIGHT_UP, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }

    if (wasWheelDown && !this.wheelDown) {
      this.signal.dispatch(InputType.WHEEL_UP, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }

    // if (this.selectedObject && this._collisionObject) {
    if (wasLeftDown && !this.leftDown) {
      this.signal.dispatch(InputType.LEFT_CLICK, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }

    if (wasRightDown && !this.rightDown) {
      this.signal.dispatch(InputType.RIGHT_CLICK, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }

    if (wasWheelDown && !this.wheelDown) {
      this.signal.dispatch(InputType.WHEEL_CLICK, {
        data: this.raycastObject,
        mousePos: this.position,
      });
    }
    // }
  }

  private _onDocumentMouseMove(evt: MouseEvent) {
    this.onMouseMove(evt);
  }

  private canvasBounds: DOMRect;
  public onMouseMove(evt: MouseEvent) {
    if (!this.signal) return;

    evt.preventDefault();
    if (!this.screenPosition) this.screenPosition = new THREE.Vector2();

    this.canvasBounds = (this.element as HTMLElement).getBoundingClientRect();

    this.screenPosition.x =
      ((evt.clientX - this.canvasBounds.left) /
        (this.canvasBounds.right - this.canvasBounds.left)) *
        2 -
      1;
    this.screenPosition.y =
      -(
        (evt.clientY - this.canvasBounds.top) /
        (this.canvasBounds.bottom - this.canvasBounds.top)
      ) *
        2 +
      1;
    // this.signal.dispatch(InputType.MOUSE_MOVE, {
    //   data: evt,
    //   mousePos: this.position,
    // });
  }

  _onMouseWheel(evt: any) {
    if (!this.signal) return;

    if (!this.active) {
      return;
    }

    //evt.preventDefault();
    // evt.stopPropagation();

    let delta = 0;
    if (evt.wheelDelta !== undefined) {
      // WebKit / Opera / Explorer 9
      delta = evt.wheelDelta;
    } else if (evt.detail !== undefined) {
      // Firefox
      delta = -evt.detail;
    }
    if (delta > 0) {
      this.wheel++;
    } else {
      this.wheel--;
    }

    this.signal.dispatch(InputType.WHEEL_SCROLL, { data: this.wheel });
  }

  rayCast() {
    if (!this.screenPosition) return;

    this._raycaster.setFromCamera(this.screenPosition, this._camera);
    const intersects = this._raycaster.intersectObject(this.group, true);
    return intersects;
  }
}

// MouseCaster.MOUSE_OVER = 'over';
// MouseCaster.MOUSE_OUT = 'out';
// MouseCaster.LEFT_DOWN = 'down';
// MouseCaster.LEFT_UP = 'up';
// MouseCaster.LEFT_CLICK = 'click'; // only fires if the user clicked down and up while on the same object
// MouseCaster.WHEEL_SCROLL = 'wheel';
// MouseCaster.MOVE = 'move';

export default MouseCaster;
