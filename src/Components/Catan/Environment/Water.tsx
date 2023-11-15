import { BufferGeometry, Euler, InstancedBufferAttribute, InstancedMesh, Matrix4, ShaderMaterial, Vector3 } from "three";
import View from "../../../lib/scene/View";
import Tile from "../../../lib/map/Tile";
import Tools from "../../../lib/utils/Tools";
import Map from "../../../lib/map/Map";



export const createWater = (ShapeGeometry: BufferGeometry) => {
    const geom = ShapeGeometry.clone();
    const material = new ShaderMaterial({
        uniforms: {
            iTime: { value: 0 },
            iResolution: { value: new Vector3() },
            // iPosition: { value: container.position.clone() }
        },
        vertexShader: `
        varying vec2 vUv;
        attribute float instanceIndex; // Add the instance index attribute
        varying float vIndex;
        attribute vec3 instancePosition;
        varying vec3 vInstancePosition;
    
        void main() {
          vIndex = instanceIndex;
          vInstancePosition = instancePosition;
    
          vec4 mvPosition = instanceMatrix * vec4(position, 1.0); // Multiply the vertex position by the instanceMatrix
          vUv = mvPosition.xy;
          gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
        }
        `,
        fragmentShader: `uniform float iTime;
        uniform vec3 iResolution;
        varying vec2 vUv;
        varying float vIndex;
        varying vec3 vInstancePosition;
    
        #define NOISE fbm
        #define NUM_NOISE_OCTAVES 1
        #define SPEED 1.0
        //#define SMOOTH 1
    
        float hash(float n) { return fract(sin(n) * 1e4); }
        float hash(vec2 p) { return (sin(iTime * 3.0 * SPEED) * 0.02) + fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
    
        float noise(float x) {
            float i = floor(x);
            float f = fract(x);
            float u = f * f * (3.0 - 2.0 * f);
            return mix(hash(i), hash(i + 1.0), u);
        }
    
        float noise(vec2 x) {
            vec2 i = floor(x);
            vec2 f = fract(x);
    
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
    
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
    
        float noise(vec3 x) {
            const vec3 step = vec3(110, 241, 171);
    
            vec3 i = floor(x);
            vec3 f = fract(x);
    
            float n = dot(i, step);
    
            vec3 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(
                    mix(hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                    mix(hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x),
                    u.y
                ),
                mix(
                    mix(hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                    mix(hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x),
                    u.y
                ),
                u.z
            );
        }
    
        float fbm(float x) {
            float v = 0.0;
            float a = 0.475;
            float shift = float(100);
            for (int i = 0; i < NUM_NOISE_OCTAVES; ++i) {
                v += a * noise(x);
                x = x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
    
        float fbm(vec2 x) {
            float v = 0.0;
            float a = 0.475;
            vec2 shift = vec2(100);
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
            for (int i = 0; i < NUM_NOISE_OCTAVES; ++i) {
                v += a * noise(x);
                x = rot * x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
    
        float fbm(vec3 x) {
            float v = 0.0;
            float a = 0.475;
            vec3 shift = vec3(100);
            for (int i = 0; i < NUM_NOISE_OCTAVES; ++i) {
                v += a * noise(x);
                x = x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
    
        void main() {
            vec2 pos = vec2(vUv.x, iResolution.y - vUv.y);
            vec2 coord = pos * 0.15 - vec2(iTime * 0.5, iResolution.y / 2.0);  
            float speed = 0.3 * SPEED;
            float limit = 0.095;
            float border = 0.04;
            float c = NOISE(coord - speed * iTime) * NOISE(coord + speed * iTime);
            vec3 color = vec3(step(limit - border, c), step(limit, c), 1.0);
            if (color.x == 1.0 && color.y != 1.0 && color.x == 1.0) {
                color = vec3(1.0, 1.0, 1.0);
            } else {
                color = vec3(0.06, 0.4, 1.0);
            }
        #ifdef SMOOTH
            c = smoothstep(limit - border, limit, c) - smoothstep(limit, limit + border, c);
            gl_FragColor = vec4(c * c * c, 0.25 + 0.75 * c * c, 0.5 + 0.5 * c, 1.0);
        #else
            gl_FragColor.rgb = clamp(color, 0.0, 1.0);
        #endif
        }
        `,
        colorWrite: true,
        visible: true,
    });
    const mesh = new InstancedMesh(geom, material.clone(), 1);
    const flatRotationMatrix = new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, 0, 0));

    // Create an array to store instance matrices
    for (let i = 0; i < 1; i++) {
        const matrix = new Matrix4().setPosition(0, 0, 0)
        mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    const numInstances = 1;
    const instanceIndexAttr = new InstancedBufferAttribute(new Float32Array(numInstances * 1), 1);
    for (let i = 0; i < numInstances; i++) {
        instanceIndexAttr.setX(i, i); // Set the instance index for each instance
    }

    const instancePositionArray = new Float32Array(numInstances * 3); // 3 components for x, y, z
    for (let i = 0; i < numInstances; i++) {
        const offset = i * 3;
        instancePositionArray[offset] = 0;
        instancePositionArray[offset + 1] = 0;
        instancePositionArray[offset + 2] = 0;
    }

    geom.setAttribute('instancePosition', new InstancedBufferAttribute(instancePositionArray, 3));

    // Add the instance index attribute to the geometry
    geom.setAttribute('instanceIndex', instanceIndexAttr);

    return mesh;
}

export default (tileShapeGeometry: BufferGeometry, containers: Tile[], map: Map, scene?: View) => {
    // Create a plane geometry
    // const geo = new PlaneGeometry(100, 100);
    let waterMat: ShaderMaterial;

    // Create a shader material
    let addAnim = false;
    if (!waterMat) {
        const material = new ShaderMaterial({
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new Vector3() },
                // iPosition: { value: container.position.clone() }
            },
            vertexShader: `
            varying vec2 vUv;
            attribute float instanceIndex; // Add the instance index attribute
            varying float vIndex;
            attribute vec3 instancePosition;
            varying vec3 vInstancePosition;
        
            void main() {
              vIndex = instanceIndex;
              vInstancePosition = instancePosition;
        
              vec4 mvPosition = instanceMatrix * vec4(position, 1.0); // Multiply the vertex position by the instanceMatrix
              vUv = mvPosition.xz;
              gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
            }
            `,
            fragmentShader: `uniform float iTime;
            uniform vec3 iResolution;
            varying vec2 vUv;
            varying float vIndex;
            varying vec3 vInstancePosition;
        
            #define NOISE fbm
            #define NUM_NOISE_OCTAVES 1
            #define SPEED 1.0
            //#define SMOOTH 1
        
            float hash(float n) { return fract(sin(n) * 1e4); }
            float hash(vec2 p) { return (sin(iTime * 3.0 * SPEED) * 0.02) + fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
        
            float noise(float x) {
                float i = floor(x);
                float f = fract(x);
                float u = f * f * (3.0 - 2.0 * f);
                return mix(hash(i), hash(i + 1.0), u);
            }
        
            float noise(vec2 x) {
                vec2 i = floor(x);
                vec2 f = fract(x);
        
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
        
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
        
            float noise(vec3 x) {
                const vec3 step = vec3(110, 241, 171);
        
                vec3 i = floor(x);
                vec3 f = fract(x);
        
                float n = dot(i, step);
        
                vec3 u = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(
                        mix(hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                        mix(hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x),
                        u.y
                    ),
                    mix(
                        mix(hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                        mix(hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x),
                        u.y
                    ),
                    u.z
                );
            }
        
            float fbm(float x) {
                float v = 0.0;
                float a = 0.475;
                float shift = float(100);
                for (int i = 0; i < NUM_NOISE_OCTAVES; ++i) {
                    v += a * noise(x);
                    x = x * 2.0 + shift;
                    a *= 0.5;
                }
                return v;
            }
        
            float fbm(vec2 x) {
                float v = 0.0;
                float a = 0.475;
                vec2 shift = vec2(100);
                mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
                for (int i = 0; i < NUM_NOISE_OCTAVES; ++i) {
                    v += a * noise(x);
                    x = rot * x * 2.0 + shift;
                    a *= 0.5;
                }
                return v;
            }
        
            float fbm(vec3 x) {
                float v = 0.0;
                float a = 0.475;
                vec3 shift = vec3(100);
                for (int i = 0; i < NUM_NOISE_OCTAVES; ++i) {
                    v += a * noise(x);
                    x = x * 2.0 + shift;
                    a *= 0.5;
                }
                return v;
            }
        
            void main() {
                vec2 pos = vec2(vUv.x, iResolution.y - vUv.y);
                vec2 coord = pos * 0.15 - vec2(iTime * 0.5, iResolution.y / 2.0);  
                float speed = 0.3 * SPEED;
                float limit = 0.095;
                float border = 0.04;
                float c = NOISE(coord - speed * iTime) * NOISE(coord + speed * iTime);
                vec3 color = vec3(step(limit - border, c), step(limit, c), 1.0);
                if (color.x == 1.0 && color.y != 1.0 && color.x == 1.0) {
                    color = vec3(1.0, 1.0, 1.0);
                } else {
                    color = vec3(0.06, 0.4, 1.0);
                }
            #ifdef SMOOTH
                c = smoothstep(limit - border, limit, c) - smoothstep(limit, limit + border, c);
                gl_FragColor = vec4(c * c * c, 0.25 + 0.75 * c * c, 0.5 + 0.5 * c, 1.0);
            #else
                gl_FragColor.rgb = clamp(color, 0.0, 1.0);
            #endif
            }
            `,
            colorWrite: true,
            visible: true,
        });
        waterMat = material.clone();
        addAnim = true;
    } else {
        console.log('water mat already exists')
    }

    const geom = tileShapeGeometry.clone();
    // Create a mesh with the geometry and material
    const mesh = new InstancedMesh(geom, waterMat, containers.length);
    const flatRotationMatrix = new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, 0, 0));

    // Create an array to store instance matrices
    for (let i = 0; i < containers.length; i++) {
        const x = containers[i].mesh.position.x;
        const y = containers[i].mesh.position.y;
        const z = containers[i].mesh.position.z;

        const matrix = new Matrix4().setPosition(x, y, z).multiply(flatRotationMatrix);
        mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    const numInstances = containers.length;
    const instanceIndexAttr = new InstancedBufferAttribute(new Float32Array(numInstances * 1), 1);
    for (let i = 0; i < numInstances; i++) {
        instanceIndexAttr.setX(i, i); // Set the instance index for each instance
    }

    const instancePositionArray = new Float32Array(numInstances * 3); // 3 components for x, y, z
    for (let i = 0; i < numInstances; i++) {
        const offset = i * 3;
        instancePositionArray[offset] = containers[i].mesh.position.x;
        instancePositionArray[offset + 1] = containers[i].mesh.position.y;
        instancePositionArray[offset + 2] = containers[i].mesh.position.z;
    }

    geom.setAttribute('instancePosition', new InstancedBufferAttribute(instancePositionArray, 3));

    // Add the instance index attribute to the geometry
    geom.setAttribute('instanceIndex', instanceIndexAttr);

    map.group.add(mesh);

    // container.add(mesh);

    if (addAnim && scene !== undefined)
        scene.animationManager.addOnAnimateListener((dt) => {
            // if (Tools.isMeshInView()) {
            // Update the shader uniforms
            waterMat.uniforms.iTime.value += dt * .35;
            waterMat.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
            // }
        });

    return mesh;
}

export const updateWaterMaterial = (waterMat: ShaderMaterial, dt, res: { x: number, y: number }) => {
    waterMat.uniforms.iTime.value += dt * .35;
    waterMat.uniforms.iResolution.value.set(res.x, res.y, 1);
}