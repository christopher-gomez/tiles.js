import Engine from '../Engine';
import * as THREE from 'three';
import Tile from '../map/Tile';
import { Intersection, Vector3, Vector2, Camera, Raycaster, Object3D } from 'three';
import Signal from '../lib/Signal';
import View from '../scene/View';
import Controller from '../scene/Controller';
import Entity from '../env/Entity';
import MeshText from '../env/MeshText';
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
	MOVE = "MOVE",
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

	constructor(group: Object3D, camera: Camera, element: HTMLElement, public controls: Controller) {
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

		this.element = element || document;

		this.element.addEventListener('mousemove', this._onDocumentMouseMove.bind(this), false);
		this.element.addEventListener('mousedown', this._onDocumentMouseDown.bind(this), false);
		this.element.addEventListener('mouseup', this._onDocumentMouseUp.bind(this), false);
		this.element.addEventListener('mousewheel', this._onMouseWheel.bind(this), false);
		this.element.addEventListener('DOMMouseScroll', this._onMouseWheel.bind(this), false); // firefox
		this.element.addEventListener("touchstart", (e: Event | TouchEvent) => {
			this._onDocumentMouseDown((e as TouchEvent).touches[0])
			//e.preventDefault()
		}, false)
		this.element.addEventListener("touchmove", (e: Event | TouchEvent) => {
			this._onDocumentMouseDown((e as TouchEvent).touches[0])
			//e.preventDefault()
		}, false)
		this.element.addEventListener("touchend", (e) => this._onDocumentMouseUp((e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0]), false)
	}

	dispose(ctx: any) {
		this.signal.removeAll(ctx);
		this.element.removeEventListener('mousemove', this._onDocumentMouseDown, false);
		this.element.removeEventListener('touchmove', this._onDocumentMouseMove, false);
		this.element.removeEventListener('mousedown', this._onDocumentMouseDown, false);
		this.element.removeEventListener('touchstart', this._onDocumentMouseDown, false);
		this.element.removeEventListener('mouseup', this._onDocumentMouseUp, false);
		this.element.removeEventListener('touchend', this._onDocumentMouseUp, false);
		this.element.removeEventListener('mousewheel', this._onMouseWheel, false);
		this.element.removeEventListener('DOMMouseScroll', this._onMouseWheel, false); // firefox
	}


	// private _collisionObjects: { topObject: any, [name: string]: any } = { topObject: null };

	private _collisionObject;

	update() {
		if (!this.active || !this.screenPosition || this.controls.panning) {
			return;
		}

		const intersects = this.rayCast();
		let hit, obj;
		// let prevHits = { ...this._collisionObjects };
		// let curHits = [];
		let hits = 0;
		if (intersects.length > 0 && (intersects[0].object.userData.structure)) {
			// get the first object under the mouse

			let cur = 0;
			// const prevIntersects = [];
			// while (cur < intersects.length) {

			hit = intersects[0];

			if (hit.object && hit.object instanceof Entity) {
				if (hit.object.ignoreRay) {
					return;
				}
			}

			if (hit.object && hit.object && hit.object.userData.structure instanceof MeshText) {
				return;
			}

			obj = hit.object.userData.structure;

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

			if (obj !== undefined && (this._collisionObject !== obj)) {
				// the first object changed, meaning there's a different one, or none at all
				if (this._collisionObject) {
					// it's a new object, notify the old object is going away
					this.signal.dispatch(InputType.MOUSE_OUT, { data: this._collisionObject });
				}

				// if (cur === 0) {
				this._collisionObject = obj;

				if (hits === 0) {
					this.selectedObject = null;
					// this._collisionObjects.topObject = obj;
				}
				// }

				this.signal.dispatch(InputType.MOUSE_OVER, { data: obj, order: hits });

				if (this.rightDown) this.signal.dispatch(InputType.RIGHT_DOWN, { data: obj, order: hits });
				if (this.leftDown) this.signal.dispatch(InputType.LEFT_DOWN, { data: obj, order: hits });
				if (this.wheelDown) this.signal.dispatch(InputType.WHEEL_DOWN, { data: obj, order: hits });

				hits++;
			}

			if (obj instanceof Tile) {
				this.position.copy(hit.point);
				(this.screenPosition as any).z = hit.distance;
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
		}
		else {
			// there isn't anything under the mouse
			// if (this.pickedObject) {
			// there was though, we just moved out
			// for (const obj in this._collisionObjects) {
			// if (obj === 'topObject') continue;

			if (this._collisionObject) {
				this.signal.dispatch(InputType.MOUSE_OUT, { data: this._collisionObject });
				this._collisionObject = null;
			}


			this._collisionObject = null;

			// }
			// this.pickedObject = null;
			this.selectedObject = null;
		}

		this.allHits = intersects;
	}

	preventDefault() {
		this._preventDefault = true;
	}

	_onDocumentMouseDown(evt: any) {
		if (evt instanceof MouseEvent)
			evt.preventDefault();

		if (this._preventDefault) {
			this._preventDefault = false;
			return false;
		}

		if (this._collisionObject) {
			this.selectedObject = this._collisionObject;
		}

		if (evt instanceof MouseEvent) {
			this.shift = evt.shiftKey;
			this.ctrl = evt.ctrlKey;

			this.leftDown = evt.button === 0;
			this.wheelDown = evt.button === 1;
			this.rightDown = evt.button === 2;
		}

		if (this.leftDown) {
			this.signal.dispatch(InputType.LEFT_DOWN, { data: this._collisionObject, order: 0 });
		}

		if (this.wheelDown) {
			this.signal.dispatch(InputType.WHEEL_DOWN, { data: this._collisionObject, order: 0 });
		}

		if (this.rightDown) {
			this.signal.dispatch(InputType.RIGHT_DOWN, { data: this._collisionObject, order: 0 });
		}
	}

	_onDocumentMouseUp(evt: any) {

		evt.preventDefault();

		if (this._preventDefault) {
			this._preventDefault = false;
			return false;
		}

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
			this.signal.dispatch(InputType.LEFT_UP, { data: this._collisionObject, order: 0 });
		}

		if (wasRightDown && !this.rightDown) {
			this.signal.dispatch(InputType.RIGHT_UP, { data: this._collisionObject, order: 0 });
		}

		if (wasWheelDown && !this.wheelDown) {
			this.signal.dispatch(InputType.WHEEL_UP, { data: this._collisionObject, order: 0 });
		}

		if (this.selectedObject && this._collisionObject) {
			if (wasLeftDown && !this.leftDown) {
				this.signal.dispatch(InputType.LEFT_CLICK, { data: this._collisionObject, order: 0 });
			}

			if (wasRightDown && !this.rightDown) {
				this.signal.dispatch(InputType.RIGHT_CLICK, { data: this._collisionObject, order: 0 });
			}

			if (wasWheelDown && !this.wheelDown) {
				this.signal.dispatch(InputType.WHEEL_CLICK, { data: this._collisionObject, order: 0 });
			}
		}
	}

	_onDocumentMouseMove(evt: MouseEvent) {
		evt.preventDefault();
		if (!this.screenPosition) this.screenPosition = new THREE.Vector2();

		const canvasBounds = (this.element as HTMLElement).getBoundingClientRect();

		this.screenPosition.x = ((evt.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
		this.screenPosition.y = - ((evt.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;
		this.signal.dispatch(InputType.MOVE, { data: evt });
	}

	_onMouseWheel(evt: any) {
		if (!this.active) {
			return;
		}

		//evt.preventDefault();
		evt.stopPropagation();

		let delta = 0;
		if (evt.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9
			delta = evt.wheelDelta;
		}
		else if (evt.detail !== undefined) { // Firefox
			delta = -evt.detail;
		}
		if (delta > 0) {
			this.wheel++;
		}
		else {
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