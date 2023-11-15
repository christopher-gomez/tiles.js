/* eslint-disable */

import PM_PRNG from "prng-parkmiller-js";
import SimplexNoise from "simplex-noise";
import {
  BackSide,
  Box3,
  BoxBufferGeometry,
  BoxGeometry,
  Color,
  CylinderBufferGeometry,
  Float32BufferAttribute,
  Frustum,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Quaternion,
  ShaderMaterial,
  Sphere,
  SphereGeometry,
  Vector3,
} from "three";
import MeshEntity from "../env/MeshEntity";
import Engine from "../Engine";
// import Map from "../map/Map";
// import Tile from "../map/Tile";

const EPSILON = 1e-5;

const rng1 = PM_PRNG.create(Date.now() * Math.random() * 100);
const rng2 = PM_PRNG.create(Date.now() * Math.random() * 100);
const gen1 = new SimplexNoise(rng1.nextDouble.bind(rng1));
const gen2 = new SimplexNoise(rng2.nextDouble.bind(rng2));

const boxGeomCache = {};
const sphereGeomCache = {};
const cylinderGeomCache = {};
// const phongMatCache = {};
const frustum = new Frustum();
const box = new Box3();
const cameraViewProjectionMatrix = new Matrix4();
const tmpQuaternion = new Quaternion();

const _sizeVec1 = new Vector3();
const _sizeVec2 = new Vector3();

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "0x" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export const Tools = {
  clamp: function (val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  sign: function (val) {
    return val && val / Math.abs(val);
  },

  /**
   * If one value is passed, it will return something from -val to val.
   * Else it returns a value between the range specified by min, max.
   */
  random: function (min, max) {
    if (max === undefined) {
      return Math.random() * min - min * 0.5;
    }
    return Math.random() * (max - min) + min;
  },

  noise1: function (nx, ny) {
    return gen1.noise2D(nx, ny) / 2 + 0.5;
  },
  noise2: function (nx, ny) {
    return gen2.noise2D(nx, ny) / 2 + 0.5;
  },

  // from min to (and including) max
  randomInt: function (min, max) {
    if (arguments.length === 1) {
      min = Math.ceil(min);
      return (Math.random() * min - min * 0.5) | 0;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

  normalize: function (v, min, max) {
    return (v - min) / (max - min);
  },
  normalize: function (value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  },

  getShortRotation: function (angle) {
    angle %= this.TAU;
    if (angle > this.PI) {
      angle -= this.TAU;
    } else if (angle < -this.PI) {
      angle += this.TAU;
    }
    return angle;
  },

  generateID: function () {
    return Math.random().toString(36).slice(2) + Date.now();
  },

  isPlainObject: function (obj) {
    if (typeof obj !== "object" || obj.nodeType || obj === obj.window) {
      return false;
    }
    // The try/catch suppresses exceptions thrown when attempting to access the 'constructor' property of certain host objects, ie. |window.location|
    // https://bugzilla.mozilla.org/show_bug.cgi?id=814622
    try {
      if (
        obj.constructor &&
        !Object.prototype.hasOwnProperty.call(
          obj.constructor.prototype,
          "isPrototypeOf"
        )
      ) {
        return false;
      }
    } catch (err) {
      return false;
    }
    // If the function hasn't returned already, we're confident that
    // |obj| is a plain object, created by {} or constructed with new Object
    return true;
  },

  // https://github.com/KyleAMathews/deepmerge/blob/master/index.js
  merge: function (target, src) {
    const self = this,
      array = Array.isArray(src);
    let dst = (array && []) || {};
    if (array) {
      target = target || [];
      dst = dst.concat(target);
      src.forEach(function (e, i) {
        if (typeof dst[i] === "undefined") {
          dst[i] = e;
        } else if (self.isPlainObject(e)) {
          dst[i] = self.merge(target[i], e);
        } else {
          if (target.indexOf(e) === -1) {
            dst.push(e);
          }
        }
      });

      return dst;
    }

    if (target && self.isPlainObject(target)) {
      Object.keys(target).forEach(function (key) {
        dst[key] = target[key];
      });
    }

    Object.keys(src).forEach(function (key) {
      if (!src[key] || !self.isPlainObject(src[key])) {
        dst[key] = src[key];
      } else {
        if (!target[key]) {
          dst[key] = src[key];
        } else {
          dst[key] = self.merge(target[key], src[key]);
        }
      }
    });

    return dst;
  },

  now: function () {
    return window.nwf
      ? window.nwf.system.Performance.elapsedTime
      : window.performance.now();
  },

  empty: function (node) {
    while (node.lastChild) {
      node.removeChild(node.lastChild);
    }
  },

  /*
      @source: http://jsperf.com/radix-sort
     */
  radixSort: function (arr, idxBegin, idxEnd, bit) {
    idxBegin = idxBegin || 0;
    idxEnd = idxEnd || arr.length;
    bit = bit || 31;
    if (idxBegin >= idxEnd - 1 || bit < 0) {
      return;
    }
    let idx = idxBegin;
    let idxOnes = idxEnd;
    const mask = 0x1 << bit;
    while (idx < idxOnes) {
      if (arr[idx] & mask) {
        --idxOnes;
        const tmp = arr[idx];
        arr[idx] = arr[idxOnes];
        arr[idxOnes] = tmp;
      } else {
        ++idx;
      }
    }
    this.radixSort(arr, idxBegin, idxOnes, bit - 1);
    this.radixSort(arr, idxOnes, idxEnd, bit - 1);
  },

  randomizeRGB: function (base, range) {
    const rgb = base.split(",");
    let color = "rgb(";
    let i, c;
    const rgb_ = [];
    range = this.randomInt(range);
    for (i = 0; i < 3; i++) {
      c = parseInt(rgb[i]) + range;
      if (c < 0) c = 0;
      else if (c > 255) c = 255;
      color += c + ",";
      rgb_.push(c);
    }
    color = color.substring(0, color.length - 1);
    color += ")";
    return color;
  },

  getJSON: function (config) {
    const xhr = new XMLHttpRequest();
    const cache = typeof config.cache === "undefined" ? false : config.cache;
    const uri = cache
      ? config.url
      : config.url + "?t=" + Math.floor(Math.random() * 10000) + Date.now();
    xhr.onreadystatechange = function () {
      if (this.status === 200) {
        let json = null;
        try {
          json = JSON.parse(this.responseText);
        } catch (err) {
          // console.warn('[Tools.getJSON] Error: '+config.url+' is not a json resource');
          return;
        }
        config.callback.call(config.scope || null, json);
        return;
      } else if (this.status !== 0) {
        console.warn(
          "[Tools.getJSON] Error: " +
          this.status +
          " (" +
          this.statusText +
          ") :: " +
          config.url
        );
      }
    };
    xhr.open("GET", uri, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send("");
  },

  rgbToHex: function (rgbString) {
    rgbString = rgbString.split("(")[1].split(")")[0];
    let b = rgbString.split(",");
    let c = b.map(function (x) {
      //For each array element
      x = parseInt(x).toString(16); //Convert to a base16 string
      return x.length == 1 ? "0" + x : x; //Add zero if we get only one character
    });
    let d = parseInt("0x" + c.join(""), 16);
    return d;
  },

  degToRad(deg) {
    return deg * (Math.PI / 180);
  },

  radToDeg(rad) {
    return rad * (180 / Math.PI);
  },
  lerp(from, to, pct) {
    return from + (to - from) * pct;
  },
  lerpFactor(start, end, factor) {
    return (1 - factor) * start + factor * end;
  },
  isMeshInView(mesh, camera, percentageThreshold = 1) {
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    // Calculate the intersection between the mesh's bounding box and the frustum
    const tileBoundingSphere = new Sphere();
    const tileBoundingBox = new Box3().setFromObject(mesh);
    tileBoundingBox.getBoundingSphere(tileBoundingSphere);
    const intersection = frustum.intersectsSphere(tileBoundingSphere);

    if (!intersection) {
      return false; // Mesh is completely out of view
    }

    // Calculate the volume ratio of the intersection
    const intersectionVolume = tileBoundingSphere.radius * tileBoundingSphere.radius * Math.PI * 4 / 3;
    const size = tileBoundingBox.getSize(_sizeVec1);
    const totalVolume = size.x * size.y * size.z;
    const volumeRatio = intersectionVolume / totalVolume;

    // Compare the volume ratio with the percentage threshold
    return volumeRatio >= percentageThreshold;
  },
  getTileSceneWorldPosition(map, tile) {
    const container = map.group;

    const position = new Vector3();
    container.getWorldPosition(position);
    container.getWorldQuaternion(tmpQuaternion); // Get the world rotation of the container

    // Apply the inverse rotation to the tree instance position to compensate for the container's rotation
    const inverseRotation = tmpQuaternion.clone().inverse();
    position.add(tile.mesh.position); // Add the position of the tile mesh within the container
    position.applyQuaternion(inverseRotation);

    return position;
  },
  /**
 * A linear interpolator for hex colors.
 *
 * Based on:
 * https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
 *
 * @param {Number} a  (hex color start val)
 * @param {Number} b  (hex color end val)
 * @param {Number} amount  (the amount to fade from a to b)
 *
 * @example
 * // returns 0x7f7f7f
 * lerpHex(0x000000, 0xffffff, 0.5)
 *
 * @returns {Number}
 */
  lerpHex(a, b, amount) {
    const ar = a >> 16,
      ag = a >> 8 & 0xff,
      ab = a & 0xff,

      br = b >> 16,
      bg = b >> 8 & 0xff,
      bb = b & 0xff,

      rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab);

    return (rr << 16) + (rg << 8) + (rb | 0);
  },
  easeInOutQuad(from, to, delta, duration) {
    delta /= duration / 2;
    if (delta < 1) return (to / 2) * delta * delta + from;
    delta--;
    return (-to / 2) * (delta * (delta - 2) - 1) + from;
  },

  /**
   * 
   * @param {number} radius 
   * @param {import("../env/MeshEntity").EntityOptionParams} opts 
   * @returns 
   */
  createSphereEntity(radius = 4, opts = { heightOffset: 1, baseColor: 0xffffff }) {
    let geomKey = radius.toString();

    if (!(geomKey in sphereGeomCache)) {
      sphereGeomCache[geomKey] = new SphereGeometry(radius, 16, 8);
    }

    const geometry = sphereGeomCache[geomKey];

    const material = new MeshPhongMaterial({ color: opts.baseColor ?? 0xffffff });
    const sphereMesh = new MeshEntity("sphere", geometry, material, opts);
    return sphereMesh;
  },

  /**
   * 
   * @param {number} size 
   * @param {import("../env/MeshEntity").EntityOptionParams} opts 
   * @returns 
   */
  createCubeEntity(size = 2, opts = { baseColor: 0xffffff, heightOffset: 1 }) {
    let geomKey = size.toString();

    if (!(geomKey in boxGeomCache)) {
      boxGeomCache[geomKey] = new BoxBufferGeometry(size, size, size);
    }

    const geometry = boxGeomCache[geomKey];

    const material = new MeshPhongMaterial({ color: opts.baseColor ?? 0xffffff });
    const cubeMesh = new MeshEntity("cube", geometry, material, opts);
    return cubeMesh;
  },
  /**
   * 
   * @param {number} length 
   * @param {number} width 
   * @param {number} depth 
   * @param {import("../env/MeshEntity").EntityOptionParams} opts 
   * @returns 
   */
  createRectEntity(length = 4, width = 1, depth = 1, opts = { baseColor: 0xffffff, heightOffset: 1 }) {
    let geomKey = length + "-" + width + "-" + depth;

    if (!(geomKey in boxGeomCache)) {
      boxGeomCache[geomKey] = new BoxBufferGeometry(depth, length, width);
      boxGeomCache[geomKey].rotateX(Math.PI * .5);
    }

    const geometry = boxGeomCache[geomKey];

    const material = new MeshPhongMaterial({ color: opts.baseColor ?? 0xffffff });

    const cubeMesh = new MeshEntity("rect", geometry, material, opts);
    cubeMesh.up.set(0, 1, 0);


    return cubeMesh;
  },
  /**
   * 
   * @param {number} radiusTop 
   * @param {number} radiusBottom 
   * @param {number} height 
   * @param {import("../env/MeshEntity").EntityOptionParams} opts 
   * @returns 
   */
  createCylinderEntity(radiusTop, radiusBottom, height, opts = { baseColor: 0xffffff, heightOffset: 1 }) {
    let geomKey = radiusTop + "-" + radiusBottom + "-" + height;

    if (!(geomKey in cylinderGeomCache)) {
      cylinderGeomCache[geomKey] = new CylinderBufferGeometry(radiusTop, radiusBottom, height, 32);
      // cylinderGeomCache[geomKey].rotateX(Math.PI * .5);
    }

    const geometry = cylinderGeomCache[geomKey];

    const material = new MeshPhongMaterial({ color: opts.baseColor ?? 0xffffff, reflectivity: 1, refractionRatio: 1, flatShading: false, shininess: 100 });

    const cubeMesh = new MeshEntity("rect", geometry, material, opts);
    cubeMesh.up.set(0, 1, 0);


    return cubeMesh;
  },

  // Function to download data to a file
  download(data, filename, type) {
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
      var a = document.createElement("a"),
        url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  },
  approxEquals(a, b, error = EPSILON) {
    return approxZero(a - b, error);
  },
  approxZero(number, error = EPSILON) {
    return Math.abs(number) < error;
  },
  smoothDamp(
    current,
    target,
    currentVelocityRef,
    smoothTime,
    maxSpeed = Infinity,
    deltaTime,
  ) {

    // Based on Game Programming Gems 4 Chapter 1.10
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;

    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const originalTo = target;

    // Clamp maximum speed
    const maxChange = maxSpeed * smoothTime;
    change = this.clamp(change, - maxChange, maxChange);
    target = current - change;

    const temp = (currentVelocityRef.value + omega * change) * deltaTime;
    currentVelocityRef.value = (currentVelocityRef.value - omega * temp) * exp;
    let output = target + (change + temp) * exp;

    // Prevent overshooting
    if (originalTo - current > 0.0 === output > originalTo) {

      output = originalTo;
      currentVelocityRef.value = (output - originalTo) / deltaTime;

    }

    return output;
  },
  colorToSigned24Bit: (s) => {
    return (parseInt(s.substr(1), 16) << 8) / 256;
  },
  hexColorToString: (num) => {
    num >>>= 0;
    var b = num & 0xFF,
      g = (num & 0xFF00) >>> 8,
      r = (num & 0xFF0000) >>> 16,
      a = ((num & 0xFF000000) >>> 24) / 255;
    return "rgba(" + [r, g, b, a].join(",") + ")";
  },
  removeDecimals(number, precision = 0) {
    return parseFloat(number.toFixed(precision));
  },
  isEqualWithinThreshold(num1, num2, threshold) {
    return Math.abs(num1 - num2) <= threshold;
  },
  areSequentialNumbers(numbers) {
    return numbers.every((number, index, array) => index === 0 || number === array[index - 1] + 1);
  },
  createSeeThroughMaterial() {
    // Create a ShaderMaterial with a custom fragment shader
    const customMaterial = new ShaderMaterial({
      uniforms: {
        collisionOccurred: { type: 'i', value: 0 }, // Uniform to control transparency
      },
      vertexShader: `
      // Vertex shader
      varying vec3 vNormal;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
      fragmentShader: `
      // Fragment shader
      varying vec3 vNormal;
      uniform int collisionOccurred; // Uniform to control transparency

      void main() {
        vec3 normal = normalize(vNormal);
        float transparency = 1.0; // Initial transparency value

        // Check if another mesh should make this one transparent
        if (collisionOccurred) {
            transparency = 0.5; // Set transparency when colliding
        }

        gl_FragColor = vec4(1.0, 1.0, 1.0, transparency);
      }
      `,
      transparent: true,
      depthWrite: false, // Disable writing to the depth buffer for an x-ray effect
      side: BackSide, // Render the back side of the mesh for an x-ray effect
    });

    return customMaterial;
  },
  /**
   * 
   * @param {number} delay 
   * @param {() => void | undefined} onBegin 
   * @param {() => void | undefined} onEnd 
   * @returns 
   */
  CreatePromiseRoutine(endDelay, beginDelay = 0, onBegin = undefined, onEnd = undefined) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (onBegin) onBegin();

        setTimeout(() => {
          if (onEnd) onEnd();

          resolve();
        }, endDelay);
      }, beginDelay);
    })
  },
  /**
   * 
   * @param {() => void | undefined} onUp 
   * @param {() => void | undefined} onDown 
   * @param {() => void | undefined} onLeft 
   * @param {() => void | undefined} onRight 
   * @param {{[keyboardKey: string]: () => void} | undefined} extras 
   * @returns {(e: KeyboardEvent) => void}
   */
  createOnDirectionalInputDownListener(onUp = undefined, onDown = undefined, onLeft = undefined, onRight = undefined, extras = undefined) {
    return (e) => {
      if (e.key === "w" || e.key === "ArrowUp") {
        if (onUp) onUp();
      }

      if (e.key === "s" || e.key === "ArrowDown") {
        if (onDown) onDown();
      }

      if (e.key === "a" || e.key === "ArrowLeft") {
        if (onLeft) onLeft();
      }

      if (e.key === "d" || e.key === "ArrowRight") {
        if (onRight) onRight();
      }

      if (extras) {
        for (const key in extras) {
          if (e.key === key) extras[key]();
        }
      }
    };
  },
  /**
   * 
   * @param {Array} arr 
   * @returns {any}
   */
  randomElement(arr) {
    const randomElement = arr[Math.floor(Math.random() * arr.length)];
    return randomElement;
  }
};

export default Tools;
