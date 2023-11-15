/* eslint-disable */
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author ScieCode / http://github.com/sciecode
 */

import {
    Box3,
    MOUSE,
    Quaternion,
    Spherical,
    TOUCH,
    Vector2,
    Vector3,
} from 'three';
import Tools from '../utils/Tools';
import View from '../scene/View';
import EventEmitter from '../utils/EventEmitter';
import { ControllerEvent } from '../scene/Controller';

enum STATE {
    NONE = - 1,
    ROTATE = 0,
    DOLLY = 1,
    PAN = 2,
    TOUCH_ROTATE = 3,
    TOUCH_PAN = 4,
    TOUCH_DOLLY_PAN = 5,
    TOUCH_DOLLY_ROTATE = 6
};

/**
 * This set of controls performs orbiting, dollying (zooming), and panning.
 * 
 * Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
 * 
 * Orbit - right mouse or left mouse + ctrl/meta/shiftKey,
 *    
 * Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
 *    
 * Pan - left mouse / touch: one-finger move
 * @param {Camera} object 
 * @param {HTMLElement} domElement 
 * @param {View} view 
 * @param {import('../utils/Interfaces').ControllerSettings | undefined} config 
 */
class OrbitControls extends EventEmitter {
    object;
    view: View;
    domElement;

    // Set to false to disable this control
    enabled = true;

    // "target" sets the location of focus, where the object orbits around
    target = new Vector3();

    // How far you can dolly in and out ( PerspectiveCamera only )
    minDistance = 0;
    maxDistance = Infinity;

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    minPolarAngle = 0; // radians
    maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
    minAzimuthAngle = - Infinity; // radians
    maxAzimuthAngle = Infinity; // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    enableDamping = false;
    dampingFactor = 0.05;

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    enableZoom = true;
    zoomSpeed = 1.0;

    // Set to false to disable rotating
    enableRotate = true;
    rotateSpeed = 1.0;

    // Set to false to disable panning
    enablePan = true;
    panSpeed = 1.0;
    screenSpacePanning = true; // if true, pan in screen-space
    keyPanSpeed = 10.0;	// pixels moved per arrow key push

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    autoRotate = false;
    autoRotateSpeed = 1.0; // 30 seconds per round when fps is 60

    // Set to false to disable use of the keys
    enableKeys = true;

    // The four arrow keys
    keys = { LEFT: 65, UP: 87, RIGHT: 68, BOTTOM: 83 };

    // Mouse buttons
    mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

    // Touch fingers
    touches = { ONE: TOUCH.DOLLY_PAN, TWO: TOUCH.ROTATE };

    // for reset
    target0;
    position0;
    zoom0;

    allowUserHorizontalRotation = true;
    allowUserVerticalRotation = true;

    canPan = true;

    private offset = new Vector3();

    // so camera.up is the orbit axis
    private quat;
    private quatInverse;

    private lastPosition = new Vector3();
    private lastQuaternion = new Quaternion();

    constructor(object, domElement, view, config) {
        super();

        this.object = object;
        this.view = view;
        this.domElement = (domElement !== undefined) ? domElement : document;

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the object orbits around
        this.target = new Vector3();

        // How far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
        this.minAzimuthAngle = - Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.05;

        // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;

        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 1.0;

        // Set to false to disable panning
        this.enablePan = true;
        this.panSpeed = 1.0;
        this.screenSpacePanning = false; // if true, pan in screen-space
        this.keyPanSpeed = 10.0;	// pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        // If auto-rotate is enabled, you must call controls.update() in your animation loop
        this.autoRotate = false;
        this.autoRotateSpeed = 1.0; // 30 seconds per round when fps is 60

        // Set to false to disable use of the keys
        this.enableKeys = true;

        // The four arrow keys
        this.keys = { LEFT: 65, UP: 87, RIGHT: 68, BOTTOM: 83 };

        // Mouse buttons
        this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

        // Touch fingers
        this.touches = { ONE: TOUCH.DOLLY_PAN, TWO: TOUCH.ROTATE };



        this.allowUserHorizontalRotation = true;
        this.allowUserVerticalRotation = true;

        this.canPan = true;

        //

        this.domElement?.addEventListener('contextmenu', this.onContextMenu.bind(this), false);

        this.domElement?.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.domElement?.addEventListener('wheel', this.onMouseWheel.bind(this), false);

        this.domElement?.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        this.domElement?.addEventListener('touchend', this.onTouchEnd.bind(this), false);
        this.domElement?.addEventListener('touchmove', this.onTouchMove.bind(this), false);

        window.addEventListener('keydown', this.onKeyDown.bind(this), false);



        // for reset
        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;

        this.offset = new Vector3();

        // so camera.up is the orbit axis
        this.quat = new Quaternion().setFromUnitVectors(this.object.up, new Vector3(0, 1, 0));
        this.quatInverse = this.quat.clone().inverse();

        this.lastPosition = new Vector3();
        this.lastQuaternion = new Quaternion();

        if (config !== undefined) {
            this.updateSettings(config);
        }


        // force an update at start
        this.update();
    }

    /**
     * 
     * @param {import('../utils/Interfaces').ControllerSettingsParams} config 
     */
    public updateSettings(config) {
        if (!config) return;

        if (config.target !== undefined)
            this.target = config.target;
        if (config.controlled !== undefined)
            this.enabled = config.controlled;
        if (config.zoomDelta !== undefined)
            this.zoomSpeed = config.zoomDelta;
        if (config.autoRotate !== undefined)
            this.autoRotate = config.autoRotate;
        if (config.rotationDamping !== undefined)
            this.enableDamping = config.rotationDamping;
        if (config.userHorizontalRotation !== undefined)
            this.allowUserHorizontalRotation = config.userHorizontalRotation;
        if (config.userVerticalRotation !== undefined)
            this.allowUserVerticalRotation = config.userVerticalRotation;
        if (config.maxPolarAngle !== undefined)
            this.maxPolarAngle = Tools.degToRad(config.maxPolarAngle);
        if (config.minPolarAngle !== undefined)
            this.minPolarAngle = Tools.degToRad(config.minPolarAngle);
        if (config.maxAzimuthAngle !== undefined)
            this.maxAzimuthAngle = Tools.degToRad(config.maxAzimuthAngle);
        if (config.minAzimuthAngle !== undefined)
            this.minAzimuthAngle = Tools.degToRad(config.minAzimuthAngle);
        if (config.currentDistance !== undefined) {
            this.minDistance = config.currentDistance;
            this.maxDistance = config.currentDistance;
        }

        if (config.currentAzimuthAngle !== undefined)
            this.rotateHorizontalTo(Tools.degToRad(config.currentAzimuthAngle));
        if (config.currentPolarAngle !== undefined)
            this.rotateVerticalTo(Tools.degToRad(config.currentPolarAngle));
    }

    //
    // public methods
    //

    public getPolarAngle() {

        return this.spherical.phi;

    };

    public getAzimuthalAngle() {

        return this.spherical.theta;

    };

    public saveState() {

        this.target0.copy(this.target);
        this.position0.copy(this.object.position);
        this.zoom0 = this.object.zoom;

    };

    public reset() {

        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.zoom = this.zoom0;

        this.object.updateProjectionMatrix();
        this.triggerEvent(this.changeEvent.type);

        this.update();

        this.state = STATE.NONE;

    };

    public setZoom(bool) {
        this.enableZoom = bool
        if (this.enableZoom) {
            this.domElement?.addEventListener('wheel', this.onMouseWheel.bind(this), false);
        } else {
            this.domElement?.removeEventListener('wheel', this.onMouseWheel, false);
        }
    }

    public rotateHorizontalTo(azimuthAngle) {
        let delta;
        if (azimuthAngle > this.spherical.theta) {
            delta = azimuthAngle - this.spherical.theta;
        } else {
            delta = this.spherical.theta - azimuthAngle;
        }

        let theta = Tools.clamp(delta, this.minAzimuthAngle, this.maxAzimuthAngle);
        if (azimuthAngle < this.spherical.theta) {
            theta = -theta;
        }
        this.sphericalDelta.theta = theta;

        // sphericalDelta.makeSafe();
    }

    public rotateVerticalTo(polarAngle) {
        let delta;
        if (polarAngle < this.spherical.phi) {
            delta = polarAngle - this.spherical.phi;
        } else {
            delta = Math.abs(this.spherical.phi - polarAngle);
        }

        this.sphericalDelta.phi = delta;
    }



    private bounds: Box3;
    // this method is exposed, but perhaps it would be better if we can make it private...
    public update() {
        var position = this.object.position;

        this.offset.copy(position).sub(this.target);

        // rotate offset to "y-axis-is-up" space
        this.offset.applyQuaternion(this.quat);

        // angle from z-axis around y-axis
        this.spherical.setFromVector3(this.offset);

        if (this.autoRotate && this.state === STATE.NONE) {

            this.rotateLeft(this.getAutoRotationAngle());

        }

        if (this.enableDamping) {

            this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
            this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;

        } else {

            this.spherical.theta += this.sphericalDelta.theta;
            this.spherical.phi += this.sphericalDelta.phi;
        }

        // if(this.view.controller && this.view.controller.config)
        // // restrict theta to be between desired limits
        // spherical.theta = Math.max(this.view.controller.config.minAzimuthAngle, Math.min(this.view.controller.config.maxAzimuthAngle, spherical.theta));

        // console.log('minA: ' + this.minAzimuthAngle);
        // console.log('maxA: ' + this.maxAzimuthAngle);
        // console.log('min: ' + Math.min(this.maxAzimuthAngle, spherical.theta))
        // console.log('max: ' + Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, spherical.theta)))

        // if (Math.sign(this.minAzimuthAngle) === Math.sign(this.maxAzimuthAngle)) {
        //     let sign = Math.sign(this.spherical.theta);
        //     if (sign == 0) sign = 1;

        //     this.minAzimuthAngle *= sign;
        //     this.maxAzimuthAngle *= sign;
        // }

        // restrict theta to be between desired limits
        this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta));

        // restrict phi to be between desired limits
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));

        this.spherical.makeSafe();


        this.spherical.radius *= this.scale;

        // restrict radius to be between desired limits
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

        // move target to panned location

        if (this.enableDamping === true) {
            this.target.addScaledVector(this.panOffset, this.dampingFactor);
        } else {
            this.target.add(this.panOffset);

            if(!this.bounds) this.bounds = new Box3().setFromObject(this.view.map.tileGroup);

            var min_x = this.bounds.min.x;
            var max_x = this.bounds.max.x;
            var min_z = this.bounds.min.z;
            var max_z = this.bounds.max.z;
            var min_y = this.bounds.min.y;
            var max_y = this.bounds.max.y;

            if (this.target.x < min_x) this.target.setX(min_x);
            if (this.target.y < min_y) this.target.setY(min_y);
            if (this.target.z < min_z) this.target.setZ(min_z);

            if (this.target.x > max_x) this.target.setX(max_x);
            if (this.target.y > max_y) this.target.setY(max_y);
            if (this.target.z > max_z) this.target.setZ(max_z);
        }

        this.offset.setFromSpherical(this.spherical);

        // rotate offset back to "camera-up-vector-is-up" space
        this.offset.applyQuaternion(this.quatInverse);

        position.copy(this.target).add(this.offset);

        this.object.lookAt(this.target);

        if (this.enableDamping === true) {

            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);

            this.panOffset.multiplyScalar(1 - this.dampingFactor);

        } else {

            this.sphericalDelta.set(0, 0, 0);

            this.panOffset.set(0, 0, 0);

        }

        this.scale = 1;

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if (this.zoomChanged ||
            this.lastPosition.distanceToSquared(this.object.position) > this.EPS ||
            8 * (1 - this.lastQuaternion.dot(this.object.quaternion)) > this.EPS) {

            this.triggerEvent(this.changeEvent.type);

            this.lastPosition.copy(this.object.position);
            this.lastQuaternion.copy(this.object.quaternion);
            this.zoomChanged = false;

            return true;

        }

        return false;
    };

    public dispose = function () {

        this.domElement?.removeEventListener('contextmenu', this.onContextMenu, false);
        this.domElement?.removeEventListener('mousedown', this.onMouseDown, false);
        this.domElement?.removeEventListener('wheel', this.onMouseWheel, false);

        this.domElement?.removeEventListener('touchstart', this.onTouchStart, false);
        this.domElement?.removeEventListener('touchend', this.onTouchEnd, false);
        this.domElement?.removeEventListener('touchmove', this.onTouchMove, false);

        document.removeEventListener('mousemove', this.onMouseMove, false);
        document.removeEventListener('mouseup', this.onMouseUp, false);

        window.removeEventListener('keydown', this.onKeyDown, false);

        //this.dispatchEvent( { type: 'dispose' } ); // should this be added here?

    };

    //
    // internals
    //

    private changeEvent = { type: 'change' };
    private startEvent = { type: 'start' };
    private endEvent = { type: 'end' };



    private state = STATE.NONE;

    private EPS = 0.000001;

    // current position in spherical coordinates
    private spherical = new Spherical();
    private sphericalDelta = new Spherical();

    private scale = 1;
    private panOffset = new Vector3();
    private zoomChanged = false;

    private rotateStart = new Vector2();
    private rotateEnd = new Vector2();
    private rotateDelta = new Vector2();

    private panStart = new Vector2();
    private panEnd = new Vector2();
    private panDelta = new Vector2();

    private dollyStart = new Vector2();
    private dollyEnd = new Vector2();
    private dollyDelta = new Vector2();

    private getAutoRotationAngle() {

        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;

    }

    private getZoomScale() {

        return Math.pow(0.95, this.zoomSpeed);

    }

    private rotateLeft(angle) {

        let type = angle < 0 ? 'rotate-right' : 'rotate-left'
        this.triggerEvent(type, { type: type, state: 'start' });

        this.sphericalDelta.theta -= angle;

        this.triggerEvent(type, { type: type, state: 'end' });
    }

    private rotateUp(angle) {
        let type = angle < 0 ? 'rotate-down' : 'rotate-up'

        this.triggerEvent(type, { type: type, state: 'start' });

        this.sphericalDelta.phi -= angle;

        this.triggerEvent(type, { type: type, state: 'end' });
    }


    private panLeft(distance, objectMatrix) {
        var v = new Vector3();

        v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
        v.multiplyScalar(- distance);
        this.panOffset.add(v);
    }

    private panUp(distance, objectMatrix) {

        var v = new Vector3();
        if (this.screenSpacePanning === true) {

            v.setFromMatrixColumn(objectMatrix, 1);

        } else {

            v.setFromMatrixColumn(objectMatrix, 0);
            v.crossVectors(this.object.up, v);

        }

        v.multiplyScalar(distance);

        this.panOffset.add(v);

    }

    // deltaX and deltaY are in pixels; right and down are positive
    private pan(deltaX, deltaY) {

        var offset = new Vector3();


        var element = this.domElement === document ? this.domElement.body : this.domElement;
        // this.triggerEvent('pan', { state: 'start' });

        if (this.object.isPerspectiveCamera) {

            // perspective
            var position = this.object.position;
            offset.copy(position).sub(this.target);
            var targetDistance = offset.length();

            // half of the fov is center to top of screen
            targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);

            // we use only clientHeight here so aspect ratio does not distort speed
            this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
            this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);

        } else if (this.object.isOrthographicCamera) {

            // orthographic
            this.panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
            this.panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);

        } else {

            // camera neither orthographic nor perspective
            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
            this.enablePan = false;
        }

        this.update();

        this.triggerEvent('pan');
    }

    private dollyIn(dollyScale) {

        if (this.object.isPerspectiveCamera) {

            this.scale /= dollyScale;

        } else if (this.object.isOrthographicCamera) {

            this.object.zoom = Math.max(this.minDistance, Math.min(this.maxDistance, this.object.zoom * dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;

        } else {

            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
            this.enableZoom = false;

        }

    }

    private dollyOut(dollyScale) {

        if (this.object.isPerspectiveCamera) {

            this.scale *= dollyScale;

        } else if (this.object.isOrthographicCamera) {

            this.object.zoom = Math.max(this.minDistance, Math.min(this.maxDistance, this.object.zoom / dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;

        } else {

            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
            this.enableZoom = false;

        }

    }

    //
    // event callbacks - update the object state
    //

    private handleMouseDownRotate(event) {

        this.rotateStart.set(event.clientX, event.clientY);

    }

    private handleMouseDownDolly(event) {

        this.dollyStart.set(event.clientX, event.clientY);

    }



    private handleMouseDownPan(event) {

        if (!this.canPan) return;

        this.view.animationManager.stopAnimation(ControllerEvent.ZOOM, true);
        this.view.animationManager.stopAnimation(ControllerEvent.PAN, true);
        this.view.animationManager.stopAnimation(ControllerEvent.ROTATE, true);

        this.panStart.set(event.clientX, event.clientY);

    }

    private handleMouseMoveRotate(event) {

        this.rotateEnd.set(event.clientX, event.clientY);

        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

        var element = this.domElement === document ? this.domElement.body : this.domElement;

        if (this.allowUserHorizontalRotation)
            this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height

        if (this.allowUserVerticalRotation)
            this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

        this.rotateStart.copy(this.rotateEnd);

        this.update();

    }

    private handleMouseMoveDolly(event) {

        this.dollyEnd.set(event.clientX, event.clientY);

        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

        if (this.dollyDelta.y > 0) {

            this.dollyIn(this.getZoomScale());

        } else if (this.dollyDelta.y < 0) {

            this.dollyOut(this.getZoomScale());

        }

        this.dollyStart.copy(this.dollyEnd);

        this.update();

    }

    private handleMouseMovePan(event) {
        // while (this.view.animationManager.animations.length >= 1) {
        // 	this.view.animationManager.cancelAnimation();
        // }

        if (!this.canPan) return;

        this.panEnd.set(event.clientX, event.clientY);

        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

        this.pan(this.panDelta.x, this.panDelta.y);

        // const cell = this.view.map.grid.pixelToCell(this.object.position);
        // const t = this.view.map.getTileAtCell(cell);
        // if (!t) this.pan(-panDelta.x, -panDelta.y);

        this.panStart.copy(this.panEnd);

        this.update();
    }

    private handleMouseUp(event) {

        // no-op
    }

    private handleMouseWheel(event) {

        if (event.deltaY < 0) {

            this.dollyOut(this.getZoomScale());

        } else if (event.deltaY > 0) {

            this.dollyIn(this.getZoomScale());

        }

        this.update();

    }

    private handleKeyDown(event) {

        // var needsUpdate = false;

        // switch (event.keyCode) {

        // 	case this.keys.UP:
        // 		this.pan(0, this.keyPanSpeed);
        // 		needsUpdate = true;
        // 		break;

        // 	case this.keys.BOTTOM:
        // 		this.pan(0, - this.keyPanSpeed);
        // 		needsUpdate = true;
        // 		break;

        // 	case this.keys.LEFT:
        // 		this.pan(this.keyPanSpeed, 0);
        // 		needsUpdate = true;
        // 		break;

        // 	case this.keys.RIGHT:
        // 		this.pan(- this.keyPanSpeed, 0);
        // 		needsUpdate = true;
        // 		break;

        // }

        // if (needsUpdate) {

        // 	// prevent the browser from scrolling on cursor keys
        // 	event.preventDefault();

        // 	this.update();

        // }


    }

    private handleTouchStartRotate(event) {

        if (event.touches.length == 1) {

            this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);

        } else {

            var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
            var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

            this.rotateStart.set(x, y);

        }

    }

    private handleTouchStartPan(event) {

        if (event.touches.length == 1) {

            this.panStart.set(event.touches[0].pageX, event.touches[0].pageY);

        } else {

            var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
            var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

            this.panStart.set(x, y);

        }

    }

    private handleTouchStartDolly(event) {

        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;

        var distance = Math.sqrt(dx * dx + dy * dy);

        this.dollyStart.set(0, distance);

    }

    private handleTouchStartDollyPan(event) {

        if (this.enableZoom) this.handleTouchStartDolly(event);

        if (this.enablePan) this.handleTouchStartPan(event);

    }

    private handleTouchStartDollyRotate(event) {

        if (this.enableZoom) this.handleTouchStartDolly(event);

        if (this.enableRotate) this.handleTouchStartRotate(event);

    }

    private handleTouchMoveRotate(event) {

        if (event.touches.length == 1) {

            this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);

        } else {

            var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
            var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

            this.rotateEnd.set(x, y);

        }

        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

        var element = this.domElement === document ? this.domElement.body : this.domElement;

        if (this.allowUserHorizontalRotation)
            this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height

        if (this.allowUserVerticalRotation)
            this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

        this.rotateStart.copy(this.rotateEnd);

    }

    private handleTouchMovePan(event) {

        if (event.touches.length == 1) {
            this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);

        } else {

            var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
            var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

            this.panEnd.set(x, y);

        }

        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

        this.pan(this.panDelta.x, this.panDelta.y);

        this.panStart.copy(this.panEnd);
    }

    private handleTouchMoveDolly(event) {

        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;

        var distance = Math.sqrt(dx * dx + dy * dy);

        this.dollyEnd.set(0, distance);

        this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));

        this.dollyIn(this.dollyDelta.y);

        this.dollyStart.copy(this.dollyEnd);

    }

    private handleTouchMoveDollyPan(event) {

        if (this.enableZoom) this.handleTouchMoveDolly(event);

        if (this.enablePan) this.handleTouchMovePan(event);

    }

    private handleTouchMoveDollyRotate(event) {

        if (this.enableZoom) this.handleTouchMoveDolly(event);

        if (this.enableRotate) this.handleTouchMoveRotate(event);

    }

    private handleTouchEnd(event) {

        // no-op

    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    private onMouseDown(event) {

        if (this.enabled === false) return;

        // Prevent the browser from scrolling.

        event.preventDefault();

        // Manually set the focus since calling preventDefault above
        // prevents the browser from setting it automatically.

        this.domElement?.focus ? this.domElement?.focus() : window.focus();

        switch (event.button) {

            case 0:

                switch (this.mouseButtons.LEFT) {

                    case MOUSE.ROTATE:

                        if (event.ctrlKey || event.metaKey || event.shiftKey) {

                            if (this.canPan === false) return;
                            // if (this.view.controller.mouseCaster.selectedObject === null) return;

                            // while (this.view.animationManager.animations.length >= 1) {
                            // 	this.view.animationManager.cancelAnimation();
                            // }
                            this.handleMouseDownPan(event);

                            this.state = STATE.PAN;

                        } else {

                            if (this.enableRotate === false) return;

                            this.handleMouseDownRotate(event);

                            this.state = STATE.ROTATE;

                        }

                        break;

                    case MOUSE.PAN:

                        if (event.ctrlKey || event.metaKey || event.shiftKey) {

                            if (this.enableRotate === false) return;

                            this.handleMouseDownRotate(event);

                            this.state = STATE.ROTATE;

                        } else {
                            if (this.enablePan === false) return;
                            // if (this.view.controller.mouseCaster.pickedObject === null) return;

                            this.handleMouseDownPan(event);

                            this.state = STATE.PAN;

                        }

                        break;

                    default:

                        this.state = STATE.NONE;

                }

                break;


            case 1:

                switch (this.mouseButtons.MIDDLE) {

                    case MOUSE.DOLLY:

                        if (this.enableZoom === false) return;

                        this.handleMouseDownDolly(event);

                        this.state = STATE.DOLLY;

                        break;


                    default:

                        this.state = STATE.NONE;

                }

                break;

            case 2:

                switch (this.mouseButtons.RIGHT) {

                    case MOUSE.ROTATE:

                        // if (this.enableRotate === false) return;

                        this.handleMouseDownRotate(event);

                        this.state = STATE.ROTATE;

                        break;

                    case MOUSE.PAN:

                        if (this.enablePan === false) return;

                        this.handleMouseDownPan(event);

                        this.state = STATE.PAN;

                        break;

                    default:

                        this.state = STATE.NONE;

                }

                break;

        }

        if (this.state !== STATE.NONE) {

            document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            document.addEventListener('mouseup', this.onMouseUp.bind(this), false);

            this.triggerEvent(this.startEvent.type);

        }

    }

    private onMouseMove(event) {

        if (this.enabled === false) return;

        event.preventDefault();

        switch (this.state) {

            case STATE.ROTATE:

                if (this.enableRotate === false) return;

                this.handleMouseMoveRotate(event);

                break;

            case STATE.DOLLY:

                if (this.enableZoom === false) return;

                this.handleMouseMoveDolly(event);

                break;

            case STATE.PAN:

                if (this.enablePan === false) return;

                this.handleMouseMovePan(event);

                break;

        }

    }

    private onMouseUp(event) {

        if (this.enabled === false) return;

        this.handleMouseUp(event);

        document.removeEventListener('mousemove', this.onMouseMove, false);
        document.removeEventListener('mouseup', this.onMouseUp, false);

        this.triggerEvent(this.endEvent.type);

        this.state = STATE.NONE;

    }

    private onMouseWheel(event) {

        if (this.enabled === false || this.enableZoom === false || (this.state !== STATE.NONE && this.state !== STATE.ROTATE)) return;

        const type = event.deltaY < 0 ? 'zoom-in' : 'zoom-out';
        event.preventDefault();
        //event.stopPropagation();

        this.triggerEvent(type, { type: type, state: 'start', event });

        this.handleMouseWheel(event);

        this.triggerEvent(type, { type: type, state: 'end', event });

    }

    private onKeyDown(event) {

        if (this.enabled === false || this.enableKeys === false || this.enablePan === false) return;

        this.handleKeyDown(event);

    }

    private onTouchStart(event) {

        if (this.enabled === false) return;

        //event.preventDefault();

        switch (event.touches.length) {

            case 1:

                switch (this.touches.ONE) {

                    case TOUCH.ROTATE:

                        if (this.enableRotate === false) return;

                        this.handleTouchStartRotate(event);

                        this.state = STATE.TOUCH_ROTATE;

                        break;

                    case TOUCH.PAN:

                        if (this.enablePan === false) return;

                        this.handleTouchStartPan(event);

                        this.state = STATE.TOUCH_PAN;

                        break;

                    default:

                        this.state = STATE.NONE;

                }

                break;

            case 2:

                switch (this.touches.TWO) {

                    case TOUCH.DOLLY_PAN:

                        if (this.enableZoom === false && this.enablePan === false) return;

                        this.handleTouchStartDollyPan(event);

                        this.state = STATE.TOUCH_DOLLY_PAN;

                        break;

                    case TOUCH.DOLLY_ROTATE:

                        if (this.enableZoom === false && this.enableRotate === false) return;

                        this.handleTouchStartDollyRotate(event);

                        this.state = STATE.TOUCH_DOLLY_ROTATE;

                        break;

                    default:

                        this.state = STATE.NONE;

                }

                break;

            default:

                this.state = STATE.NONE;

        }

        if (this.state !== STATE.NONE) {

            this.triggerEvent(this.startEvent.type);

        }

    }

    private onTouchMove(event) {

        if (this.enabled === false) return;

        event.preventDefault();
        // event.stopPropagation();

        switch (this.state) {

            case STATE.TOUCH_ROTATE:

                if (this.enableRotate === false) return;

                this.handleTouchMoveRotate(event);

                this.update();

                break;

            case STATE.TOUCH_PAN:

                if (this.enablePan === false) return;

                this.handleTouchMovePan(event);

                this.update();

                break;

            case STATE.TOUCH_DOLLY_PAN:

                if (this.enableZoom === false && this.enablePan === false) return;

                this.handleTouchMoveDollyPan(event);

                this.update();

                break;

            case STATE.TOUCH_DOLLY_ROTATE:

                if (this.enableZoom === false && this.enableRotate === false) return;

                this.handleTouchMoveDollyRotate(event);

                this.update();

                break;

            default:

                this.state = STATE.NONE;

        }

    }

    private onTouchEnd(event) {

        if (this.enabled === false) return;

        this.handleTouchEnd(event);

        this.triggerEvent(this.endEvent.type);

        this.state = STATE.NONE;

    }

    private onContextMenu(event) {

        if (this.enabled === false) return;

        event.preventDefault();

    }
}

// OrbitControls.prototype = Object.create(EventDispatcher.prototype);
// OrbitControls.prototype.constructor = OrbitControls;


// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
// This is very similar to OrbitControls, another set of touch behavior
//
//    Orbit - right mouse, or left mouse + ctrl/meta/shiftKey / touch: two-finger rotate
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - left mouse, or arrow keys / touch: one-finger move

// var MapControls = function (object, domElement) {

//     OrbitControls.call(this, object, domElement);

//     this.mouseButtons.LEFT = MOUSE.PAN;
//     this.mouseButtons.RIGHT = MOUSE.ROTATE;

//     this.touches.ONE = TOUCH.PAN;
//     this.touches.TWO = TOUCH.DOLLY_ROTATE;

// };

// MapControls.prototype = Object.create(EventDispatcher.prototype);
// MapControls.prototype.constructor = MapControls;

export { OrbitControls };
