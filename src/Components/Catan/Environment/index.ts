import { AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, Camera, ClampToEdgeWrapping, Color, CylinderGeometry, DataTexture, DoubleSide, Float32BufferAttribute, FloatType, Geometry, Group, InstancedBufferAttribute, InstancedBufferGeometry, InstancedMesh, LinearFilter, Matrix4, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, NearestFilter, Object3D, ObjectLoader, PlaneBufferGeometry, PlaneGeometry, Points, PointsMaterial, Quaternion, RGBAFormat, RawShaderMaterial, RedFormat, RepeatWrapping, ShaderMaterial, Texture, TextureLoader, Vector2, Vector3, Vector4 } from "three";
import HexCell from "../../../lib/grid/HexCell";
import hilltexture from '../../../Assets/Textures/top-view-artificial-grass-soccer-field-background-texture.jpg';
import Tools from "../../../lib/utils/Tools";
import SimplexNoise from "simplex-noise";
import Controller from "../../../lib/scene/Controller";
import Engine from "../../../lib/Engine";
import snowFlakeSprite from '../../../Assets/Textures/snowflake1.png';
import Tile from "../../../lib/map/Tile";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";

//@ts-ignore
import treeModel from '../../../Assets/Models/Coniferous_Trees/Tree_Spruce_tiny_02.fbx';
import treeTexture from '../../../Assets/Models/Coniferous_Trees/texture_solid.png';

//@ts-ignore
import cactusModel from '../../../Assets/Models/cactus/cactus.fbx';
import cactusDiffuseTexture from '../../../Assets/Models/cactus/diffuse.png';
import cactusNormalTexture from '../../../Assets/Models/cactus/normal.png';
import cactusRoughTexture from '../../../Assets/Models/cactus/roughness.png';
import cactusSpikesTexture from '../../../Assets/Models/cactus/spikes.png';

var loader = new TextureLoader();
loader.crossOrigin = '';
var grassTexture = loader.load('https://al-ro.github.io/images/grass/blade_diffuse.jpg');
var alphaMap = loader.load('https://al-ro.github.io/images/grass/blade_alpha.jpg');
var noiseTexture = loader.load('https://al-ro.github.io/images/grass/perlinFbm.jpg');

//Sun
//Height over horizon in range [0, PI/2.0]
var elevation = Math.PI / 2;
//Rotation around Y axis in range [0, 2*PI]
var azimuth = 0.4;

var fogFade = 0.005;

//Lighting variables for grass
var ambientStrength = 0.7;
var translucencyStrength = 1.5;
var specularStrength = 0.5;
var diffuseStrength = 1.5;
var shininess = 256;
var sunColour = new Vector3(1.0, 1.0, 1.0);
var specularColour = new Vector3(1.0, 1.0, 1.0);

//Variables for blade mesh
var joints = 4;

var instancedGrassGeometry: InstancedBufferGeometry;
var grassBaseGeometry;
var baseBlade: Mesh;

function getSharedPrefix() {

    var sharedPrefix = `
    uniform sampler2D noiseTexture;
    uniform float heightFactor;
    uniform float pixelSample;

    // attribute float isEdge;  // Assuming 'isEdge' attribute is a float attribute
`;

    return sharedPrefix;
}

// Helper function for smoothstep interpolation
function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}


const noiseScale = .05; // Adjust the noise scale to control the smoothness of the slopes

// Good for plataeus
function gradient(x, y) {
    // Calculate the distance from the center of the rectangle
    const distance = Math.hypot(x, y);

    // Apply a gradient function to create slopes
    const slope = 10 - Math.pow(distance, 2);

    return slope;
}

function gentleSlopeNoise(x, y, min, max) {
    // Generate Perlin noise values for the given coordinates
    const noiseX = x * noiseScale;
    const noiseY = y * noiseScale;
    const perlinValue = sNoise.noise2D(noiseX, noiseY);

    // Apply the gradient function to the Perlin noise value
    const slope = gradient(x, y) * perlinValue;

    // Normalize the slope to the range [min, max]
    const normalizedSlope = (slope + 1) / 2;

    // Interpolate the normalized slope between the min and max values
    const noiseValue = normalizedSlope * (max - min) + min;

    return Math.min(Math.max(noiseValue, min), max);
}

function pointInBounds(x, y, points: Vector2[]) {
    let i, j, nvert = points.length;
    let c = false;

    for (i = 0, j = nvert - 1; i < nvert; j = i++) {
        if (((points[i].y > y) != (points[j].y > y)) &&
            (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)
        )
            c = !c;
    }

    return c;

}

const sNoise = new SimplexNoise();

// Simplex noise function for polar coordinates within hex tiles
export function circularHexagonNoise(p, min, max, width, height, hexNoiseOpts: HexNoiseOptions = { amplitudeFactor: 5, frequencyFactor: 2.75, amplitudeExponent1: 3, amplitudeExponent2: 1, fallOffExponent: 1, }, container: Tile, customNoise?: SimplexNoise) {
    let { amplitudeFactor, frequencyFactor, amplitudeExponent1, amplitudeExponent2, fallOffExponent } = hexNoiseOpts;

    let mNoise;
    if (customNoise) mNoise = customNoise;
    else mNoise = sNoise;

    const distance = Math.hypot(p.x, p.z);

    let falloffFactor = 1 - Math.pow(Math.pow(distance, 1.075) / HexCell.radius, fallOffExponent); // Adjust the exponent for the desired falloff curve

    let frequency = frequencyFactor; // Adjust the frequency to control the scale of the noise
    let amplitude = amplitudeFactor * Math.pow(distance / HexCell.radius, amplitudeExponent1) + Math.pow(distance / HexCell.radius, amplitudeExponent2); // Adjust the exponents for amplitude control

    // Generate simplex noise for the Cartesian coordinates
    const noiseValue = mNoise.noise2D((p.x / (width * .85)) * frequency, (p.z / (height * .85)) * frequency);

    // Normalize the noise value to the specified range [min, max]
    const normalizedValue = normalize(noiseValue, -1, 1, min, max);

    // Apply amplitude, weight, and falloff factor to the normalized value
    const noise = normalizedValue * amplitude * falloffFactor;

    return Math.max(noise, min);
}

export function rowHexagonNoise(p, min, max, width, height, hexNoiseOpts: HexNoiseOptions = {
    amplitudeFactor: 5,
    frequencyFactor: 2.75,
    amplitudeExponent1: 3,
    amplitudeExponent2: 1,
    fallOffExponent: 1,
}, container: Tile, customNoise?: SimplexNoise) {
    let { amplitudeFactor, frequencyFactor, amplitudeExponent1, amplitudeExponent2, fallOffExponent } = hexNoiseOpts;

    let mNoise;
    if (customNoise) mNoise = customNoise;
    else mNoise = sNoise;

    const distance = Math.hypot(p.x, p.z);

    // if (distance < 5) {
    //     return min;
    // }

    let falloffFactor = 1 - Math.pow(Math.pow(distance, 1.075) / HexCell.radius, fallOffExponent); // Adjust the exponent for the desired falloff curve

    let frequency = frequencyFactor; // Adjust the frequency to control the scale of the noise
    let amplitude = amplitudeFactor * Math.pow(distance / HexCell.radius, amplitudeExponent1) + Math.pow(distance / HexCell.radius, amplitudeExponent2); // Adjust the exponents for amplitude control

    // Generate simplex noise for the Cartesian coordinates
    const noiseValue = mNoise.noise2D((p.x / (width * .85)) * frequency, (p.z / (height * .85)) * frequency);

    // Normalize the noise value to the specified range [min, max]
    const normalizedValue = normalize(noiseValue, -1, 1, min, max);

    // Apply amplitude, weight, and falloff factor to the normalized value
    let noise = normalizedValue * amplitude * falloffFactor;

    // Create additional layers of noise with different frequencies and amplitudes
    // to form rows of dirt mounds
    const numRows = 5; // Adjust the number of rows as needed
    for (let i = 1; i <= numRows; i++) {
        const rowFrequency = frequencyFactor * (1 + i * 2); // Increase the frequency for each row
        const rowAmplitude = amplitudeFactor * Math.pow(distance / HexCell.radius, amplitudeExponent1 + i); // Use different amplitude exponents for each row

        const rowNoiseValue = mNoise.noise2D((p.x / (width * .85)) * rowFrequency, (p.z / (height * .85)) * rowFrequency);
        const rowNormalizedValue = normalize(rowNoiseValue, -1, 1, min, max);
        const rowFalloffFactor = 1 - Math.pow(Math.pow(distance, 1.075) / HexCell.radius, fallOffExponent); // Same falloff factor for each row

        // Apply the additional row noise to the overall noise value
        noise += rowNormalizedValue * rowAmplitude * rowFalloffFactor;
    }

    return Math.min(Math.max(noise, min), max);
}

// Helper function to normalize a value from the range [oldMin, oldMax] to the range [newMin, newMax]
function normalize(value, oldMin, oldMax, newMin, newMax) {
    const oldRange = oldMax - oldMin;
    const newRange = newMax - newMin;
    return ((value - oldMin) * newRange) / oldRange + newMin;
}

export function generateMeshNoise(meshGeometry, minHeight, maxHeight, width, height, hexNoiseOpts: HexNoiseOptions = { amplitudeFactor: 5, frequencyFactor: 2.75, amplitudeExponent1: 3, amplitudeExponent2: 1, fallOffExponent: 1, }, container: Tile, isRow = false) {
    const positionAttribute = meshGeometry.getAttribute('position');
    const positions = positionAttribute.array;
    const numVertices = positions.length / 3;

    const noiseValues = new Array(numVertices); // Intermediate array to store noise values at positions

    for (let i = 0; i < numVertices; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];

        // Convert the position to polar coordinates
        const polarPosition = {
            x: x,
            y: y,
            z: z
        };

        // Generate smooth noise within the hexagon bounds
        let noise;
        if (!isRow)
            noise = circularHexagonNoise(polarPosition, minHeight, maxHeight, width, height, hexNoiseOpts, container);
        else
            noise = rowHexagonNoise(polarPosition, minHeight, maxHeight, width, height, hexNoiseOpts, container);

        // Set the Y coordinate of the vertex position to the minimum height
        positions[i * 3 + 1] = noise;

        // if (i < numVertices - 50) {
        // Store the noise value at the corresponding position in the intermediate array
        noiseValues[i] = { x, z, y: noise };
        // }
    }

    // Update the position attribute with the modified positions
    positionAttribute.needsUpdate = true;

    // Recalculate the vertex normals
    meshGeometry.computeVertexNormals();

    return noiseValues;
}

const Ground = (width: number, height: number, resolution: number, boundary: Vector2[], container: Tile, color: string | number = "rgb(10%, 25%, 2%)", minTerrainHeight: number, maxTerrainHeight: number, hexNoiseOpts: HexNoiseOptions = { amplitudeFactor: 5, frequencyFactor: 2.75, amplitudeExponent1: 3, amplitudeExponent2: 1, fallOffExponent: 1, }, map?: Texture, isRow = false) => {
    //************** Ground **************
    //Ground material is a modification of the existing MeshPhongMaterial rather than one from scratch

    // width += 10;
    // height += 10;
    var groundGeometry = new PlaneBufferGeometry(width, height, resolution, resolution);
    groundGeometry.lookAt(new Vector3(0, 1, 0));
    groundGeometry.translate(0, container.geometry.boundingBox.max.z + .1, 0);
    groundGeometry.computeVertexNormals();

    // Get the position attribute and clone it
    var positionAttribute = groundGeometry.getAttribute('position');
    const vertices = [];

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        vertices.push(new Vector3(x, y, z));
    }

    let total = 0;
    for (const vert of vertices) {
        if (pointInBounds(vert.x, vert.z, boundary)) total++;
    }

    positionAttribute.needsUpdate = true;
    var basePositionAttribute = positionAttribute.clone();
    groundGeometry.setAttribute('basePosition', basePositionAttribute);

    groundGeometry.computeBoundingBox();
    // 0x69a442
    var groundMaterial = new MeshPhongMaterial({
        color: new Color(color),
        side: DoubleSide,
        map: map
    });

    var ground = new Mesh(groundGeometry, groundMaterial);

    var noise = generateMeshNoise(groundGeometry, minTerrainHeight, maxTerrainHeight, width, height, hexNoiseOpts, container, isRow);

    return { ground, noise };
}

export interface HexNoiseOptions {
    amplitudeFactor: number,
    frequencyFactor: number,
    amplitudeExponent1: number,
    amplitudeExponent2: number,
    fallOffExponent: number,
}

export const hillsNoiseOpts = {
    amplitudeFactor: 6, frequencyFactor: 2.75, amplitudeExponent1: 2.5, amplitudeExponent2: 1, fallOffExponent: .75
}

export const createHills = (width: number, height: number, resolution: number, boundary: Vector2[], container: Tile, map?: Texture) => {
    let ground = Ground(width, height, resolution, boundary, container, map ? 0xffffff : "rgb(10%,25%,2%)", container.geometry.boundingBox.max.z + .25, 12, hillsNoiseOpts, map);

    var deltaX = width / resolution;
    var deltaY = height / resolution;

    var groundVertexPrefix = getSharedPrefix() + ` 
    attribute vec3 basePosition;
    uniform float deltaX;
    uniform float deltaY;
    uniform float posX;
    uniform float posZ;
    uniform float width;
    uniform float height;
    uniform vec2[${boundary.length}]validPoints; // Adjust the size according to your needs
    varying vec2 vPosition;
    varying float vHeight;
    varying float vWidth;
    varying vec2[${boundary.length}]vPoints;
    varying float yposition;
    varying vec2 vNPosition;

//     bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
// {
//           int nvert = numPoints;
//           bool c = false;

//     for (int i = 0, j = nvert - 1; i < nvert; j = i++)
//     {
//         if (((points[i].y > y) != (points[j].y > y)) &&
//             (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
//             c = !c;
//         }
//     }

//     return c;
// }

//     vec3 getPosition(vec3 pos, float epsX, float epsZ){
//       vec3 temp;
//     temp.x = pos.x + epsX;
//     temp.z = pos.z + epsZ;
//     vec2 _pos = vec2(basePosition.x + epsX + deltaX * floor(posX), basePosition.z + epsZ + deltaY * floor(posZ));

//     temp.y = getYPosition(_pos, true, false);

//     return temp;
// }

//     //Find the normal at pos as the cross product of the central-differences in x and z directions
//     vec3 getNormal(vec3 pos){
//         float eps = .35;

//         // Get the positions for central-differences in x and z directions
//         vec3 posP = getPosition(pos, eps, 0.0);
//         vec3 posN = getPosition(pos, -eps, 0.0);
//         vec3 posZP = getPosition(pos, 0.0, eps);
//         vec3 posZN = getPosition(pos, 0.0, -eps);
//         vec3 posPP = getPosition(pos, 2.0 * eps, 0.0);
//         vec3 posNN = getPosition(pos, -2.0 * eps, 0.0);
//         vec3 posZPP = getPosition(pos, 0.0, 2.0 * eps);
//         vec3 posZNN = getPosition(pos, 0.0, -2.0 * eps);

//         // Compute the slope vectors in the x and z directions
//         vec3 slopeX = 0.25 * (4.0 * (posP - posN) + (posPP - posNN));
//         vec3 slopeZ = 0.25 * (4.0 * (posZP - posZN) + (posZPP - posZNN));

//         // Compute the averaged normal using cross product
//         vec3 norm = normalize(cross(slopeZ, slopeX));

//         // if (!pointInBounds(pos.x, pos.z, vPoints, ${boundary.length})) {
//         //     norm = normalize(vec3(0,1,0));
//         // }

//         return norm;
// }
`;

    let groundFragmentPrefix = `
      varying vec2 vPosition;
      varying float vHeight;
      varying float vWidth;
      varying vec2[${boundary.length}]vPoints;
      varying vec2 vNPosition;

      bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
{
          int nvert = numPoints;
          bool c = false;

    for (int i = 0, j = nvert - 1; i < nvert; j = i++)
    {
        if (((points[i].y > y) != (points[j].y > y)) &&
            (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
            c = !c;
        }
    }

    return c;
}

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float a = hash(i);
    float b = hash(i + 1.0);
    return mix(a, b, f);
}
`;

    ground.ground.material.onBeforeCompile = function (shader) {
        shader.uniforms.deltaX = { value: deltaX };
        shader.uniforms.deltaY = { value: deltaY };
        shader.uniforms.posX = { value: .1 };
        shader.uniforms.posZ = { value: .1 };
        shader.uniforms.width = { value: width };
        shader.uniforms.height = { value: height };
        shader.uniforms.validPoints = { value: boundary };
        shader.uniforms.noiseTexture = { value: noiseTexture };
        // shader.uniforms.isEdge = { value: isEdgeAttribute };
        shader.vertexShader = groundVertexPrefix + shader.vertexShader;

        if (map) {
            shader.uniforms.mapTexture = { value: map };
            shader.vertexShader = `
        uniform sampler2D mapTexture;
        // varying vec2 vUv;
        ${shader.vertexShader}
    `;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);
            float tilingFactor = 3.0; // Adjust this value based on how much tiling you want
            vUv.x = uv.x * tilingFactor;
            vUv.y = uv.y * tilingFactor;            
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        else {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        shader.fragmentShader = groundFragmentPrefix + shader.fragmentShader;
        if (map) {
            // shader.fragmentShader = `
            // varying vec2 vUv;
            // ${shader.fragmentShader}
            // `;
            shader.fragmentShader = shader.fragmentShader.replace(
                'vec4 texColor = texture2D(mapTexture, uv);',
                `
                float uOffset = noise(vUv.x * 10.0) * 0.05; // Adjust the multiplier and factor as needed
                float vOffset = noise(vUv.y * 10.0) * 0.05;
                vec2 perturbedUV = vec2(vUv.x + uOffset, vUv.y + vOffset);
                vec4 texColor = texture2D(mapTexture, perturbedUV);
                `
            );
        }

        shader.fragmentShader = `
    ${shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `  
        if (!pointInBounds(vNPosition.x, vNPosition.y, vPoints, ${boundary.length})) {
          discard; // Discard the pixel
      }

        gl_FragColor = vec4(outgoingLight, diffuseColor.a);
        `
        )
            }
`;
    };

    return ground;
}

export const mountainsNoiseOpts = {
    amplitudeFactor: 15.5, frequencyFactor: 6.5, amplitudeExponent1: 3.25, amplitudeExponent2: 2, fallOffExponent: .95
}

export const createMountains = (width: number, height: number, resolution: number, boundary: Vector2[], container: Tile, map?: Texture) => {
    const ground = Ground(width, height, resolution, boundary, container, map ? 0xffffff : 'gray', container.geometry.boundingBox.max.z + .25, 12, mountainsNoiseOpts, map);
    var deltaX = width / resolution;
    var deltaY = height / resolution;

    var groundVertexPrefix = getSharedPrefix() + ` 
    attribute vec3 basePosition;
    uniform float deltaX;
    uniform float deltaY;
    uniform float posX;
    uniform float posZ;
    uniform float width;
    uniform float height;
    uniform vec2[${boundary.length}]validPoints; // Adjust the size according to your needs
    varying vec2 vPosition;
    varying float vHeight;
    varying float vWidth;
    varying vec2[${boundary.length}]vPoints;
    varying float yposition;
    varying vec2 vNPosition;

//     bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
// {
//           int nvert = numPoints;
//           bool c = false;

//     for (int i = 0, j = nvert - 1; i < nvert; j = i++)
//     {
//         if (((points[i].y > y) != (points[j].y > y)) &&
//             (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
//             c = !c;
//         }
//     }

//     return c;
// }

//     vec3 getPosition(vec3 pos, float epsX, float epsZ){
//       vec3 temp;
//     temp.x = pos.x + epsX;
//     temp.z = pos.z + epsZ;
//     vec2 _pos = vec2(basePosition.x + epsX + deltaX * floor(posX), basePosition.z + epsZ + deltaY * floor(posZ));

//     temp.y = getYPosition(_pos, true, false);

//     return temp;
// }

//     //Find the normal at pos as the cross product of the central-differences in x and z directions
//     vec3 getNormal(vec3 pos){
//         float eps = .35;

//         // Get the positions for central-differences in x and z directions
//         vec3 posP = getPosition(pos, eps, 0.0);
//         vec3 posN = getPosition(pos, -eps, 0.0);
//         vec3 posZP = getPosition(pos, 0.0, eps);
//         vec3 posZN = getPosition(pos, 0.0, -eps);
//         vec3 posPP = getPosition(pos, 2.0 * eps, 0.0);
//         vec3 posNN = getPosition(pos, -2.0 * eps, 0.0);
//         vec3 posZPP = getPosition(pos, 0.0, 2.0 * eps);
//         vec3 posZNN = getPosition(pos, 0.0, -2.0 * eps);

//         // Compute the slope vectors in the x and z directions
//         vec3 slopeX = 0.25 * (4.0 * (posP - posN) + (posPP - posNN));
//         vec3 slopeZ = 0.25 * (4.0 * (posZP - posZN) + (posZPP - posZNN));

//         // Compute the averaged normal using cross product
//         vec3 norm = normalize(cross(slopeZ, slopeX));

//         // if (!pointInBounds(pos.x, pos.z, vPoints, ${boundary.length})) {
//         //     norm = normalize(vec3(0,1,0));
//         // }

//         return norm;
// }

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float a = hash(i);
    float b = hash(i + 1.0);
    return mix(a, b, f);
}
`;

    let groundFragmentPrefix = `
      varying vec2 vPosition;
      varying float vHeight;
      varying float vWidth;
      varying vec2[${boundary.length}]vPoints;
      varying vec2 vNPosition;

      bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
{
          int nvert = numPoints;
          bool c = false;

    for (int i = 0, j = nvert - 1; i < nvert; j = i++)
    {
        if (((points[i].y > y) != (points[j].y > y)) &&
            (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
            c = !c;
        }
    }

    return c;
}
`;
    const positionAttribute = ground.ground.geometry.getAttribute('position') as Float32BufferAttribute;
    const positions = positionAttribute.array;

    let largestY = positions[1]; // Assuming the first vertex Y value is the largest initially

    for (let i = 1; i < positions.length; i += 3) {
        const y = positions[i + 1];
        if (y > largestY) {
            largestY = y;
        }
    }

    ground.ground.material.onBeforeCompile = function (shader) {
        shader.uniforms.deltaX = { value: deltaX };
        shader.uniforms.deltaY = { value: deltaY };
        shader.uniforms.posX = { value: .1 };
        shader.uniforms.posZ = { value: .1 };
        shader.uniforms.width = { value: width };
        shader.uniforms.height = { value: height };
        shader.uniforms.validPoints = { value: boundary };
        shader.uniforms.noiseTexture = { value: noiseTexture };
        // shader.uniforms.isEdge = { value: isEdgeAttribute };
        shader.vertexShader = groundVertexPrefix + shader.vertexShader;

        if (map) {
            shader.uniforms.mapTexture = { value: map };
            shader.vertexShader = `
        uniform sampler2D mapTexture;
        // varying vec2 vUv;
        ${shader.vertexShader}
    `;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);

            float snowThreshold = 6.0; // Adjust this value as needed
            float snowStart = 0.5; // Start of snowy portion in UV y-coordinate
            float snowEnd = 0.7; // End of snowy portion in UV y-coordinate
            
            if (position.y < snowThreshold) {
                // For ground vertices below the threshold, adjust the UV value with noise for more variance
                if(position.y > ${container.geometry.boundingBox.max.z + .1}) {
                float noiseVarianceX = noise(position.x + position.z) * 15.0; // Adjust the multiplier for desired variance in x
                float noiseVarianceY = noise(position.z - position.x) * .1; // Adjust the multiplier for desired variance in y
                vUv.x = mix(0.8, .85, noiseVarianceX); // Interpolate between 0.5 and 1.0 based on noise
                vUv.y = mix(0.0, .1, noiseVarianceY); // Interpolate between 0.0 and 0.1 based on noise
                } else {
                    vUv.x = .8;
                    vUv.y = .1;
                }
            } else {
                // For mountain vertices above the threshold, adjust the UV value based on height
                float heightFactor = (position.y - snowThreshold) / (float(${largestY})- snowThreshold); // Normalize height factor to [0, 1]
                float noiseVariance = noise(position.x + position.z) * 100.0; // Adjust the multiplier for desired variance
                vUv.x = uv.x;
                vUv.y = mix(snowStart, snowEnd, heightFactor) + noiseVariance;
            }
            
            // vUv.y = vUv.y * 2.0;
            
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        else {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        shader.fragmentShader = groundFragmentPrefix + shader.fragmentShader;
        if (map) {
            // shader.fragmentShader = `
            // varying vec2 vUv;
            // ${shader.fragmentShader}
            // `;
            shader.fragmentShader = shader.fragmentShader.replace(
                'vec4 texColor = texture2D(mapTexture, uv);',
                'vec4 texColor = texture2D(mapTexture, vUv);'
            );
        }

        shader.fragmentShader = `
    ${shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `  
        if (!pointInBounds(vNPosition.x, vNPosition.y, vPoints, ${boundary.length})) {
          discard; // Discard the pixel
      }

        gl_FragColor = vec4(outgoingLight, diffuseColor.a);
        `
        )
            }
`;
    };

    return ground;
}

export const dirtNoiseOpts: HexNoiseOptions = {
    amplitudeFactor: 0.005,
    frequencyFactor: 10.0,
    amplitudeExponent1: 2,
    amplitudeExponent2: .1,
    fallOffExponent: 30,
};

export const createFarmland = (width: number, height: number, resolution: number, boundary: Vector2[], container: Tile, map?: Texture) => {
    const ground = Ground(width, height, resolution, boundary, container, map ? 0xffffff : 0x9e723a, container.geometry.boundingBox.max.z + .25, 2, dirtNoiseOpts, map, true);
    var deltaX = width / resolution;
    var deltaY = height / resolution;

    var groundVertexPrefix = getSharedPrefix() + ` 
    attribute vec3 basePosition;
    uniform float deltaX;
    uniform float deltaY;
    uniform float posX;
    uniform float posZ;
    uniform float width;
    uniform float height;
    uniform vec2[${boundary.length}]validPoints; // Adjust the size according to your needs
    varying vec2 vPosition;
    varying float vHeight;
    varying float vWidth;
    varying vec2[${boundary.length}]vPoints;
    varying float yposition;
    varying vec2 vNPosition;

//     bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
// {
//           int nvert = numPoints;
//           bool c = false;

//     for (int i = 0, j = nvert - 1; i < nvert; j = i++)
//     {
//         if (((points[i].y > y) != (points[j].y > y)) &&
//             (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
//             c = !c;
//         }
//     }

//     return c;
// }

//     vec3 getPosition(vec3 pos, float epsX, float epsZ){
//       vec3 temp;
//     temp.x = pos.x + epsX;
//     temp.z = pos.z + epsZ;
//     vec2 _pos = vec2(basePosition.x + epsX + deltaX * floor(posX), basePosition.z + epsZ + deltaY * floor(posZ));

//     temp.y = getYPosition(_pos, true, false);

//     return temp;
// }

//     //Find the normal at pos as the cross product of the central-differences in x and z directions
//     vec3 getNormal(vec3 pos){
//         float eps = .35;

//         // Get the positions for central-differences in x and z directions
//         vec3 posP = getPosition(pos, eps, 0.0);
//         vec3 posN = getPosition(pos, -eps, 0.0);
//         vec3 posZP = getPosition(pos, 0.0, eps);
//         vec3 posZN = getPosition(pos, 0.0, -eps);
//         vec3 posPP = getPosition(pos, 2.0 * eps, 0.0);
//         vec3 posNN = getPosition(pos, -2.0 * eps, 0.0);
//         vec3 posZPP = getPosition(pos, 0.0, 2.0 * eps);
//         vec3 posZNN = getPosition(pos, 0.0, -2.0 * eps);

//         // Compute the slope vectors in the x and z directions
//         vec3 slopeX = 0.25 * (4.0 * (posP - posN) + (posPP - posNN));
//         vec3 slopeZ = 0.25 * (4.0 * (posZP - posZN) + (posZPP - posZNN));

//         // Compute the averaged normal using cross product
//         vec3 norm = normalize(cross(slopeZ, slopeX));

//         // if (!pointInBounds(pos.x, pos.z, vPoints, ${boundary.length})) {
//         //     norm = normalize(vec3(0,1,0));
//         // }

//         return norm;
// }

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float a = hash(i);
    float b = hash(i + 1.0);
    return mix(a, b, f);
}
`;

    let groundFragmentPrefix = `
      varying vec2 vPosition;
      varying float vHeight;
      varying float vWidth;
      varying vec2[${boundary.length}]vPoints;
      varying vec2 vNPosition;

      bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
{
          int nvert = numPoints;
          bool c = false;

    for (int i = 0, j = nvert - 1; i < nvert; j = i++)
    {
        if (((points[i].y > y) != (points[j].y > y)) &&
            (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
            c = !c;
        }
    }

    return c;
}
`;
    const positionAttribute = ground.ground.geometry.getAttribute('position') as Float32BufferAttribute;
    const positions = positionAttribute.array;

    let largestY = positions[1]; // Assuming the first vertex Y value is the largest initially

    for (let i = 1; i < positions.length; i += 3) {
        const y = positions[i + 1];
        if (y > largestY) {
            largestY = y;
        }
    }

    ground.ground.material.onBeforeCompile = function (shader) {
        shader.uniforms.deltaX = { value: deltaX };
        shader.uniforms.deltaY = { value: deltaY };
        shader.uniforms.posX = { value: .1 };
        shader.uniforms.posZ = { value: .1 };
        shader.uniforms.width = { value: width };
        shader.uniforms.height = { value: height };
        shader.uniforms.validPoints = { value: boundary };
        shader.uniforms.noiseTexture = { value: noiseTexture };
        // shader.uniforms.isEdge = { value: isEdgeAttribute };
        shader.vertexShader = groundVertexPrefix + shader.vertexShader;

        if (map) {
            shader.uniforms.mapTexture = { value: map };
            shader.vertexShader = `
        uniform sampler2D mapTexture;
        // varying vec2 vUv;
        ${shader.vertexShader}
    `;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);
            float tilingFactor = .2; // Adjust this value based on how much tiling you want
            vUv.x = uv.x * tilingFactor;
            vUv.y = uv.y * tilingFactor;                        
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        else {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        shader.fragmentShader = groundFragmentPrefix + shader.fragmentShader;
        if (map) {
            // shader.fragmentShader = `
            // varying vec2 vUv;
            // ${shader.fragmentShader}
            // `;
            shader.fragmentShader = shader.fragmentShader.replace(
                'vec4 texColor = texture2D(mapTexture, uv);',
                'vec4 texColor = texture2D(mapTexture, vUv);'
            );
        }

        shader.fragmentShader = `
    ${shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `  
        if (!pointInBounds(vNPosition.x, vNPosition.y, vPoints, ${boundary.length})) {
          discard; // Discard the pixel
      }

        gl_FragColor = vec4(outgoingLight, diffuseColor.a);
        `
        )
            }
`;
    };

    return ground;
}

export const clayNoiseOpts = {
    amplitudeFactor: 35, frequencyFactor: 2.2, amplitudeExponent1: 2.3, amplitudeExponent2: 20, fallOffExponent: .182
}

export const createClayLand = (width: number, height: number, resolution: number, boundary: Vector2[], container: Tile, map?: Texture) => {
    const ground = Ground(width, height, resolution, boundary, container, map ? 0xffffff : 0x964B00, container.geometry.boundingBox.max.z + .25, 7, clayNoiseOpts, map, true);
    var deltaX = width / resolution;
    var deltaY = height / resolution;

    var groundVertexPrefix = getSharedPrefix() + ` 
    attribute vec3 basePosition;
    uniform float deltaX;
    uniform float deltaY;
    uniform float posX;
    uniform float posZ;
    uniform float width;
    uniform float height;
    uniform vec2[${boundary.length}]validPoints; // Adjust the size according to your needs
    varying vec2 vPosition;
    varying float vHeight;
    varying float vWidth;
    varying vec2[${boundary.length}]vPoints;
    varying float yposition;
    varying vec2 vNPosition;

//     bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
// {
//           int nvert = numPoints;
//           bool c = false;

//     for (int i = 0, j = nvert - 1; i < nvert; j = i++)
//     {
//         if (((points[i].y > y) != (points[j].y > y)) &&
//             (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
//             c = !c;
//         }
//     }

//     return c;
// }

//     vec3 getPosition(vec3 pos, float epsX, float epsZ){
//       vec3 temp;
//     temp.x = pos.x + epsX;
//     temp.z = pos.z + epsZ;
//     vec2 _pos = vec2(basePosition.x + epsX + deltaX * floor(posX), basePosition.z + epsZ + deltaY * floor(posZ));

//     temp.y = getYPosition(_pos, true, false);

//     return temp;
// }

//     //Find the normal at pos as the cross product of the central-differences in x and z directions
//     vec3 getNormal(vec3 pos){
//         float eps = .35;

//         // Get the positions for central-differences in x and z directions
//         vec3 posP = getPosition(pos, eps, 0.0);
//         vec3 posN = getPosition(pos, -eps, 0.0);
//         vec3 posZP = getPosition(pos, 0.0, eps);
//         vec3 posZN = getPosition(pos, 0.0, -eps);
//         vec3 posPP = getPosition(pos, 2.0 * eps, 0.0);
//         vec3 posNN = getPosition(pos, -2.0 * eps, 0.0);
//         vec3 posZPP = getPosition(pos, 0.0, 2.0 * eps);
//         vec3 posZNN = getPosition(pos, 0.0, -2.0 * eps);

//         // Compute the slope vectors in the x and z directions
//         vec3 slopeX = 0.25 * (4.0 * (posP - posN) + (posPP - posNN));
//         vec3 slopeZ = 0.25 * (4.0 * (posZP - posZN) + (posZPP - posZNN));

//         // Compute the averaged normal using cross product
//         vec3 norm = normalize(cross(slopeZ, slopeX));

//         // if (!pointInBounds(pos.x, pos.z, vPoints, ${boundary.length})) {
//         //     norm = normalize(vec3(0,1,0));
//         // }

//         return norm;
// }

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float a = hash(i);
    float b = hash(i + 1.0);
    return mix(a, b, f);
}
`;

    let groundFragmentPrefix = `
      varying vec2 vPosition;
      varying float vHeight;
      varying float vWidth;
      varying vec2[${boundary.length}]vPoints;
      varying vec2 vNPosition;

      bool pointInBounds(float x, float y, vec2[${boundary.length}]points, int numPoints)
{
          int nvert = numPoints;
          bool c = false;

    for (int i = 0, j = nvert - 1; i < nvert; j = i++)
    {
        if (((points[i].y > y) != (points[j].y > y)) &&
            (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
            c = !c;
        }
    }

    return c;
}
`;
    const positionAttribute = ground.ground.geometry.getAttribute('position') as Float32BufferAttribute;
    const positions = positionAttribute.array;

    let largestY = positions[1]; // Assuming the first vertex Y value is the largest initially

    for (let i = 1; i < positions.length; i += 3) {
        const y = positions[i + 1];
        if (y > largestY) {
            largestY = y;
        }
    }

    ground.ground.material.onBeforeCompile = function (shader) {
        shader.uniforms.deltaX = { value: deltaX };
        shader.uniforms.deltaY = { value: deltaY };
        shader.uniforms.posX = { value: .1 };
        shader.uniforms.posZ = { value: .1 };
        shader.uniforms.width = { value: width };
        shader.uniforms.height = { value: height };
        shader.uniforms.validPoints = { value: boundary };
        shader.uniforms.noiseTexture = { value: noiseTexture };
        // shader.uniforms.isEdge = { value: isEdgeAttribute };
        shader.vertexShader = groundVertexPrefix + shader.vertexShader;

        if (map) {
            shader.uniforms.mapTexture = { value: map };
            shader.vertexShader = `
        uniform sampler2D mapTexture;
        // varying vec2 vUv;
        ${shader.vertexShader}
    `;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);

            vUv = uv;
            
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        else {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
            vec3 transformed = vec3(position);
            vPosition = vec2(position.x, position.z);
            yposition = transformed.y;
            vWidth = width;
            vHeight = height;
            vPoints = validPoints;
            vNPosition = vec2(position.x, position.z);
`
            );
        }
        shader.fragmentShader = groundFragmentPrefix + shader.fragmentShader;
        if (map) {
            // shader.fragmentShader = `
            // varying vec2 vUv;
            // ${shader.fragmentShader}
            // `;
            shader.fragmentShader = shader.fragmentShader.replace(
                'vec4 texColor = texture2D(mapTexture, uv);',
                'vec4 texColor = texture2D(mapTexture, vUv);'
            );
        }

        shader.fragmentShader = `
    ${shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `  
        if (!pointInBounds(vNPosition.x, vNPosition.y, vPoints, ${boundary.length})) {
          discard; // Discard the pixel
      }

        gl_FragColor = vec4(outgoingLight, diffuseColor.a);
        `
        )
            }
`;
    };

    return ground;
}

export const generateGrassSystem = (width: number, height: number, boundary: Vector2[], container: Tile, camera: Camera, controller: Controller, groundGeometry: BufferGeometry, minGrassHeight: number, maxGrassHeight: number, grassNoiseOpts: HexNoiseOptions = hillsNoiseOpts, instances = 40000, isGrass = true) => {
    var positionAttribute = groundGeometry.getAttribute('position');
    const vertices = [];
    var bladeWidth = isGrass ? 0.07 : .12;
    var bladeHeight = isGrass ? .25 : .35;

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        vertices.push(new Vector3(x, y, z));
    }

    let total = 0;
    for (const vert of vertices) {
        if (pointInBounds(vert.x, vert.z, boundary)) total++;
    }

    var deltaX = width / total;
    var deltaY = height / total;

    //************** Grass **************
    var grassVertexSource = getSharedPrefix() + `
        precision mediump float;
        // attribute vec3 position;
        // attribute vec3 normal;
        attribute vec3 offset;
        // attribute vec2 uv;
    //   uniform vec3 cameraPosition;

        attribute vec2 halfRootAngle;
        attribute float scale;
        attribute float index;
        uniform float time;
        
        uniform float deltaX;
        uniform float deltaY;
        uniform float posX;
        uniform float posZ;
        uniform float width;
        uniform float height;
        uniform float maxDistance;
        uniform mat4 yRotMatrix;
      
        // uniform mat4 modelViewMatrix;
        // uniform mat4 projectionMatrix;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float frc;
        varying float idx;
        varying float yposition;
        varying float beyondViewRange; // 0.0 = beyond, 1.0 = in view
        varying vec3 worldPos;
        varying mat4 vProjectionMatrix;

      const float PI = 3.1415;
      const float TWO_PI = 2.0 * PI;
      
        //https://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
        vec3 rotateVectorByQuaternion(vec3 v, vec4 q){
          return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
      }
      
      void main() {
        vec3 pos;
        vec3 globalPos;
        vec3 tile;
    
        globalPos.x = offset.x - posX * deltaX;
        globalPos.z = offset.z - posZ * deltaY;
    
        tile.x = floor((globalPos.x + 0.5 * width) / width);
        tile.z = floor((globalPos.z + 0.5 * height) / height);
    
        pos.x = globalPos.x;
        pos.z = globalPos.z;

        pos.y = offset.y;

        //Vertex height in blade geometry
        frc = position.y / float(` + bladeHeight + `);
    
        //Scale vertices
        vec3 vPosition = position;
        vPosition.y *= scale;
    
        //Invert scaling for normals
        vNormal = normal;
        vNormal.y /= scale;
    
        //Rotate blade around Y axis
        vec4 direction = vec4(0.0, halfRootAngle.x, 0.0, halfRootAngle.y);
        vPosition = rotateVectorByQuaternion(vPosition, direction);
        vNormal = rotateVectorByQuaternion(vNormal, direction);
    
        //UV for texture
        vUv = uv;

        yposition = pos.y;
        //Position of the blade in the visible patch [0->1]
        float fX = 0.5 + offset.x / width;
        float fZ = 0.5 + offset.z / height;
        vec2 fractionalPos = vec2(fX, fZ);
        //To make it seamless, make it a multiple of 2*PI
        fractionalPos *= TWO_PI;
    
        //Wind is sine waves in time. 
        float noise = 0.5 + 0.5 * sin(fractionalPos.y + time);
        float halfAngle = -noise * 0.1;
        noise = 0.5 + 0.5 * cos(fractionalPos.x + time);
        halfAngle -= noise * 0.05;
    
        direction = normalize(vec4(sin(halfAngle), 0.0, -sin(halfAngle), cos(halfAngle)));
      
        //Rotate blade and normals according to the wind
        vPosition = rotateVectorByQuaternion(vPosition, direction);
        vNormal = rotateVectorByQuaternion(vNormal, direction);

        //Move vertex to global location
        vPosition += pos;
        
        //Index of instance for varying colour in fragment shader
        idx = index;

        // Transform the vertex position to world space
        vec4 worldPosition = modelViewMatrix * vec4(vPosition, 1.0);

        // Access the world space coordinates
        vec3 worldPositionXYZ = worldPosition.xyz;
    
        // worldPos = vec3(worldPositionXYZ.z, worldPositionXYZ.x, worldPositionXYZ.y);
        // vec4 rotPos = yRotMatrix * vec4(worldPositionXYZ, 1.0);
        worldPos = worldPosition.xyz;

        vProjectionMatrix = projectionMatrix;
    
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
    }
    `;

    var grassFragmentSource = `
    precision mediump float;
    
    // uniform vec3 cameraPosition;

    uniform float currentDistance;
    uniform float maxDistance;
    uniform float minDistance;
    
    //Light uniforms
    uniform float ambientStrength;
    uniform float diffuseStrength;
    uniform float specularStrength;
    uniform float translucencyStrength;
    uniform float shininess;
    uniform vec3 lightColour;
    uniform vec3 sunDirection;
    
    
    //Surface uniforms
    uniform sampler2D map;
    uniform sampler2D alphaMap;
    uniform vec3 specularColour;
    
    varying float frc;
    varying float idx;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 worldPos;
    
    vec3 ACESFilm(vec3 x){
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
    }
    
    void main() {
    
      //If transparent, don't draw
      if(texture2D(alphaMap, vUv).r < 0.15){
        discard;
      }
    
      vec3 normal;
    
      //Flip normals when viewing reverse of the blade
      if(gl_FrontFacing){
        normal = normalize(vNormal);
      }else{
        normal = normalize(-vNormal);
      }
    
      //Get colour data from texture
      vec3 textureColour = pow(texture2D(map, vUv).rgb, ${isGrass ? 'vec3(2.2)' : 'vec3(.7)'});
    
      //Add different green tones towards root
      vec3 mixColour = ${isGrass ? 'idx > 0.75 ? vec3(0.2, 0.8, 0.06) : vec3(0.5, 0.8, 0.08);' : 'vec3(.03);'}
      textureColour = mix(0.1 * mixColour, textureColour, 0.75);    
      vec3 lightTimesTexture = lightColour * textureColour;
      vec3 ambient = textureColour;
      vec3 lightDir = normalize(sunDirection);
    
      //How much a fragment faces the light
      float dotNormalLight = dot(normal, lightDir);
      float diff = max(dotNormalLight, 0.0);
    
      //Colour when lit by light
      vec3 diffuse = diff * lightTimesTexture;
    
      float sky = max(dot(normal, vec3(0,1,0)), 0.0);
      vec3 skyLight = sky * vec3(0.12, 0.29, 0.55);
    
      vec3 viewDirection = normalize(cameraPosition - worldPos);
      vec3 halfwayDir = normalize(lightDir + viewDirection);
      
      //How much a fragment directly reflects the light to the camera
      float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
    
      //Colour of light sharply reflected into the camera
      vec3 specular = spec * specularColour * lightColour;
    
      //https://en.wikibooks.org/wiki/GLSL_Programming/Unity/Translucent_Surfaces
      vec3 diffuseTranslucency = vec3(0);
      vec3 forwardTranslucency = vec3(0);
      float dotViewLight = dot(-lightDir, viewDirection);
      if(dotNormalLight <= 0.0){
        diffuseTranslucency = lightTimesTexture * translucencyStrength * -dotNormalLight;
        if(dotViewLight > 0.0){
          forwardTranslucency = lightTimesTexture * translucencyStrength * pow(dotViewLight, 16.0);
        }
      }
    
      vec3 col = 0.3 * skyLight * textureColour + ambientStrength * ambient + diffuseStrength * diffuse + specularStrength * specular + diffuseTranslucency + forwardTranslucency;
    
      //Add a shadow towards root
      ${isGrass ? 'col = mix(0.35*vec3(0.1, 0.25, 0.02), col, frc);' : ""}
      
      //Tonemapping
      col = ACESFilm(col);
    
      //Gamma correction 1.0/2.2 = 0.4545...
      col = pow(col, vec3(0.4545));
    
      float t = clamp((currentDistance - minDistance) / (maxDistance - minDistance), 0.0, 1.0);
      float alpha = smoothstep(1.0, 0.0, t);
      gl_FragColor = vec4(col, alpha);
    }
  `;

    let x, y, z, w, angle, sinAngle, rotationAngle;

    // if (!grassBaseGeometry) {
    //Define base geometry that will be instanced. We use a plane for an individual blade of grass
    grassBaseGeometry = new PlaneBufferGeometry(bladeWidth, bladeHeight, 1, joints);
    grassBaseGeometry.translate(0, bladeHeight / 2, 0);

    //Define the bend of the grass blade as the combination of three quaternion rotations
    let vertex = new Vector3();
    let quaternion0 = new Quaternion();
    let quaternion1 = new Quaternion();

    //Rotate around Y
    angle = 0.05;
    sinAngle = Math.sin(angle / 2.0);
    let rotationAxis = new Vector3(0, 1, 0);
    x = rotationAxis.x * sinAngle;
    y = rotationAxis.y * sinAngle;
    z = rotationAxis.z * sinAngle;
    w = Math.cos(angle / 2.0);
    quaternion0.set(x, y, z, w);

    //Rotate around X
    angle = 0.3;
    sinAngle = Math.sin(angle / 2.0);
    rotationAxis.set(1, 0, 0);
    x = rotationAxis.x * sinAngle;
    y = rotationAxis.y * sinAngle;
    z = rotationAxis.z * sinAngle;
    w = Math.cos(angle / 2.0);
    quaternion1.set(x, y, z, w);

    //Combine rotations to a single quaternion
    quaternion0.multiply(quaternion1);

    //Rotate around Z
    angle = 0.1;
    sinAngle = Math.sin(angle / 2.0);
    rotationAxis.set(0, 0, 1);
    x = rotationAxis.x * sinAngle;
    y = rotationAxis.y * sinAngle;
    z = rotationAxis.z * sinAngle;
    w = Math.cos(angle / 2.0);
    quaternion1.set(x, y, z, w);

    //Combine rotations to a single quaternion
    quaternion0.multiply(quaternion1);

    let quaternion2 = new Quaternion();

    const bendIntensity = .015; // Adjust the bending intensity as needed

    // Generate random rotation angles for each vertex
    const vertexRotations = [];
    for (let i = 0; i < grassBaseGeometry.attributes.position.array.length / 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        vertexRotations.push(angle);
    }

    //Bend grass base geometry for more organic look
    if (isGrass) {
        for (let v = 0; v < grassBaseGeometry.attributes.position.array.length; v += 3) {
            quaternion2.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
            vertex.x = grassBaseGeometry.attributes.position.array[v];
            vertex.y = grassBaseGeometry.attributes.position.array[v + 1];
            vertex.z = grassBaseGeometry.attributes.position.array[v + 2];
            let frac = vertex.x / bladeHeight;
            quaternion2.slerp(quaternion0, frac);
            vertex.applyQuaternion(quaternion2);
            grassBaseGeometry.attributes.position.setX(v, vertex.x)
            grassBaseGeometry.attributes.position.setY(v + 1, vertex.y)
            grassBaseGeometry.attributes.position.setZ(v + 2, vertex.z)
        }
    }

    // if (isGrass) {
    //     for (let v = 0; v < grassBaseGeometry.attributes.position.array.length; v += 3) {
    //         quaternion2.setFromAxisAngle(new Vector3(0, 1, 0), vertexRotations[v / 3] * bendIntensity);

    //         vertex.x = grassBaseGeometry.attributes.position.array[v];
    //         vertex.y = grassBaseGeometry.attributes.position.array[v + 1];
    //         vertex.z = grassBaseGeometry.attributes.position.array[v + 2];

    //         vertex.applyQuaternion(quaternion2);

    //         grassBaseGeometry.attributes.position.setX(v, vertex.x)
    //         grassBaseGeometry.attributes.position.setY(v + 1, vertex.y)
    //         grassBaseGeometry.attributes.position.setZ(v + 2, vertex.z)
    //     }
    // }

    grassBaseGeometry.computeVertexNormals();
    var baseMaterial = new MeshPhongMaterial({ side: DoubleSide });
    baseBlade = new Mesh(grassBaseGeometry, baseMaterial);
    // }
    //Show grass base geometry
    //scene.add(baseBlade);

    // if (!instancedGrassGeometry) {
    instancedGrassGeometry = new InstancedBufferGeometry();

    instancedGrassGeometry.index = grassBaseGeometry.index;
    instancedGrassGeometry.attributes.position = grassBaseGeometry.attributes.position;
    instancedGrassGeometry.attributes.uv = grassBaseGeometry.attributes.uv;
    instancedGrassGeometry.attributes.normal = grassBaseGeometry.attributes.normal;


    // Each instance has its own data for position, orientation and scale
    var indices = [];
    var offsets = [];
    var scales = [];
    var halfRootAngles = [];

    // validGrassPoints.forEach(x => x.multiplyScalar(.95));

    //For each instance of the grass blade
    for (let i = 0; i < instances; i++) {
        //Offset of the roots
        let dFromCenter = 0;
        do {
            x = Math.random() * width - width / 2;
            z = Math.random() * height - height / 2;
            dFromCenter = Math.hypot(x, z);
        } while (!pointInBounds(x, z, boundary) || dFromCenter < 3);

        y = isGrass ? circularHexagonNoise({ x, y: 0, z }, minGrassHeight, maxGrassHeight, width, height, grassNoiseOpts, container) : rowHexagonNoise({ x, y: 0, z }, minGrassHeight, maxGrassHeight, width, height, grassNoiseOpts, container);

        indices.push(i / instances);

        offsets.push(x, y, z);

        //Random orientation
        let angle = Math.PI - Math.random() * (2 * Math.PI);
        halfRootAngles.push(Math.sin(0.5 * angle), Math.cos(0.5 * angle));

        //Define variety in height
        if (i % 3 != 0) {
            scales.push(1.0 + Math.random() * 1.25);
        } else {
            scales.push(1.0 + Math.random());
        }
    }

    var offsetAttribute = new InstancedBufferAttribute(new Float32Array(offsets), 3);
    var scaleAttribute = new InstancedBufferAttribute(new Float32Array(scales), 1);
    var halfRootAngleAttribute = new InstancedBufferAttribute(new Float32Array(halfRootAngles), 2);
    var indexAttribute = new InstancedBufferAttribute(new Float32Array(indices), 1);

    instancedGrassGeometry.setAttribute('offset', offsetAttribute);
    instancedGrassGeometry.setAttribute('scale', scaleAttribute);
    instancedGrassGeometry.setAttribute('halfRootAngle', halfRootAngleAttribute);
    instancedGrassGeometry.setAttribute('index', indexAttribute);
    // }

    const yAxis = new Vector3(0, 1, 0); // Assuming your y-axis is the axis around which you want to rotate
    const yRot = -90 * Math.PI / 180; // Assuming your rotation angle in radians

    // Assuming _yRot is the rotation angle of the tile in radians
    const rotationMatrix = new Matrix4().makeRotationAxis(yAxis, yRot);

    //Define the material, specifying attributes, uniforms, shaders etc.
    var grassMaterial = new ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            deltaX: { value: deltaX },
            deltaY: { value: deltaY },
            posX: { value: 0 },
            posZ: { value: 0 },
            width: { value: width },
            height: { value: height },
            map: { value: grassTexture },
            alphaMap: { value: alphaMap },
            sunDirection: { value: new Vector3(Math.sin(azimuth), Math.sin(elevation), -Math.cos(azimuth)) },
            ambientStrength: { value: ambientStrength },
            translucencyStrength: { value: translucencyStrength },
            diffuseStrength: { value: diffuseStrength },
            specularStrength: { value: specularStrength },
            shininess: { value: shininess },
            lightColour: { value: sunColour },
            specularColour: { value: specularColour },
            // currentDistance: {value: distanceInTileSpace},
            maxDistance: { value: controller.config.maxDistance },
            minDistance: { value: controller.config.minDistance + 50 },
            yRotMatrix: { value: rotationMatrix },
            // cameraPosition: { value: cameraPositionInTileSpace },
            // projectionMatrix: { value: camera.projectionMatrix },
            // modelViewMatrix: { value: baseBlade.modelViewMatrix.clone() }
        },
        vertexShader: grassVertexSource,
        fragmentShader: grassFragmentSource,
        side: DoubleSide,
        transparent: true
    });

    var grass = new Mesh(instancedGrassGeometry, grassMaterial);
    grass.rotation.x = Math.PI / 2;

    return grass;
}

export const generateSnowflakeSystem = (width: number, height: number, boundary: Vector2[], container: Tile) => {
    let particles;

    const particleNum = 1000;
    const maxRange = 10;
    const minRange = container.geometry.boundingBox.max.z + .1;
    const textureSize = 64.0;

    const drawRadialGradation = (ctx, canvasRadius, canvasW, canvasH) => {
        ctx.save();
        const gradient = ctx.createRadialGradient(canvasRadius, canvasRadius, 0, canvasRadius, canvasRadius, canvasRadius);
        gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasW, canvasH);
        ctx.restore();
    }

    const getTexture = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const diameter = textureSize;
        canvas.width = diameter;
        canvas.height = diameter;
        const canvasRadius = diameter / 2;

        /* gradation circle
        ------------------------ */
        drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);

        /* snow crystal
        ------------------------ */
        // drawSnowCrystal(ctx, canvasRadius);

        const texture = new Texture(canvas);
        //texture.minFilter = THREE.NearestFilter;
        texture.type = FloatType;
        texture.needsUpdate = true;
        return texture;
    }

    const render = (timeStamp) => {

        const posArr = particles.geometry.vertices;
        const velArr = particles.geometry.velocities;

        posArr.forEach((vertex, i) => {
            const velocity = velArr[i];

            const x = i * 3;
            const y = i * 3 + 1;
            const z = i * 3 + 2;

            // const velX = Math.sin(timeStamp * 0.00001 * velocity.x) * 0.01;
            // const velZ = Math.cos(timeStamp * 0.000015 * velocity.z) * 0.01;

            // vertex.x += velX;
            let down = Math.sin(timeStamp * 0.001 + velocity.y) * 0.1;
            if (down > 0) {
                down = -down;
            }
            vertex.y += down; // Adjust the amplitude and frequency as needed
            // vertex.z += velZ;

            // Check if the snowflake y has fallen past the minRange, and reset it to minRange to make it loop
            if (vertex.y < (minRange + (minRange * 1.5))) {
                vertex.y = startingPoints[i].y + Tools.random(0, 1);
            }

            // Keep the x and z coordinates fixed over time
            // vertex.x = startingPoints[i].x;
            // vertex.z = startingPoints[i].z;
        });

        particles.geometry.verticesNeedUpdate = true;
    };

    // const onResize = () => {
    //     const width = window.innerWidth;
    //     const height = window.innerHeight;
    //     renderer.setPixelRatio(window.devicePixelRatio);
    //     renderer.setSize(width, height);
    //     camera.aspect = width / height;
    //     camera.updateProjectionMatrix();
    // }

    /* Snow Particles
    -------------------------------------------------------------*/
    const pointGeometry = new Geometry();
    let x, y, z;
    const startingPoints = [];
    boundary = boundary.map(x => x.clone().multiplyScalar(.8))
    for (let i = 0; i < particleNum; i++) {
        let valid = false;
        do {
            x = Math.random() * width - width / 2;
            z = Math.random() * height - height / 2;

            valid = false;
            if (pointInBounds(x, z, boundary)) {
                valid = true;
                y = circularHexagonNoise({ x, y: 0, z }, minRange * 6, 18, width, height, mountainsNoiseOpts, container);
                if (y <= minRange * 6) valid = false;
            }

        } while (!valid);



        // const x = Math.floor(Math.random() * maxRange - minRange);
        // const y = Math.floor(Math.random() * maxRange - minRange);
        // const z = Math.floor(Math.random() * maxRange - minRange);
        const particle = new Vector3(x, y, z);
        startingPoints.push(particle.clone());
        pointGeometry.vertices.push(particle);
        // const color = new THREE.Color(0xffffff);
        // pointGeometry.colors.push(color);
    }

    const pointMaterial = new PointsMaterial({
        size: 1.25,
        color: 0xffffff,
        vertexColors: false,
        map: getTexture(),
        // blending: THREE.AdditiveBlending,
        transparent: true,
        // opacity: 0.8,
        fog: true,
        depthWrite: true,
        alphaTest: .15
    });

    const velocities = [];
    for (let i = 0; i < particleNum; i++) {
        const x = Math.floor(Math.random()) * 0.1;
        const y = Math.floor(Math.random() * 10 + 3) * - 0.05;
        const z = Math.floor(Math.random()) * 0.1;
        const particle = new Vector3(x, y, z);
        velocities.push(particle);
    }

    particles = new Points(pointGeometry, pointMaterial);
    particles.geometry.velocities = velocities;
    // scene.add(particles);
    particles.rotation.x = Math.PI / 2;

    /* resize
    -------------------------------------------------------------*/
    // window.addEventListener('resize', onResize);

    /* rendering start
    -------------------------------------------------------------*/
    // document.getElementById('WebGL-output').appendChild(renderer.domElement);
    // requestAnimationFrame(render);

    return { system: particles, render };
};

export const generateDustSystem = (width: number, height: number, boundary: Vector2[], container: Tile) => {
    // Step 2: Create a particle system for the dust particles
    const particleCount = 1000; // Adjust the number of particles as needed
    const particleGeometry = new BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    // Step 3: Create a custom material for the particles

    const textureSize = 64.0;

    const drawEllipticalGradation = (ctx, canvasWidth, canvasHeight) => {
        ctx.save();

        // Define the center and radii of the ellipse
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radiusX = canvasWidth / 2; // Adjust this value to control the width of the ellipse
        const radiusY = canvasHeight / 4; // Adjust this value to control the height of the ellipse

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radiusX);

        // You can adjust the color stops as needed to control the appearance of the gradient
        gradient.addColorStop(0, 'rgba(220,190,167,1.0)');
        gradient.addColorStop(0.5, 'rgba(220,190,167,0.5)');
        gradient.addColorStop(1, 'rgba(220,190,167,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.restore();
    };

    const getTexture = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = textureSize; // Adjust the texture width as needed
        const height = textureSize; // Adjust the texture height as needed

        canvas.width = width;
        canvas.height = height;

        drawEllipticalGradation(ctx, width, height);

        const texture = new Texture(canvas);
        texture.type = FloatType;
        texture.needsUpdate = true;
        return texture;
    };

    const particleMaterial = new PointsMaterial({
        transparent: true,
        alphaTest: 0.15,
        size: 1,
        color: 0xffffff,
        vertexColors: false,
        map: getTexture(),
        // blending: THREE.AdditiveBlending,
        // opacity: 0.8,
        fog: false,
        depthWrite: true
    });

    // Step 4: Position the particles around the mesas based on the noise

    // Generate a random starting point for the dust storm within the tile boundary
    let x, z;


    // Offset the initial positions of the particles based on the starting point
    for (let i = 0; i < particleCount; i++) {
        do {
            x = Math.random() * width - width / 2;
            z = Math.random() * height - height / 2;
        } while (!pointInBounds(x, z, boundary));
        particlePositions[i * 3] = x; // Add a small random offset in x direction
        particlePositions[i * 3 + 1] = 0; // Start all particles at y = 0
        particlePositions[i * 3 + 2] = z; // Add a small random offset in z direction
    }

    particleGeometry.setAttribute('position', new BufferAttribute(particlePositions, 3));
    const particleGroup = new Points(particleGeometry, particleMaterial);

    const dustSpeed = 0.05; // Adjust the speed of the dust storm
    const center = new Vector2(0, 0); // Center of the tile

    function render(time) {
        for (let i = 0; i < particleCount; i++) {
            // Get the current position of the particle
            let x = particlePositions[i * 3];
            let z = particlePositions[i * 3 + 2];

            // Calculate the direction vector from the current position to the center of the tile
            const direction = center.clone().sub(new Vector2(x, z)).normalize();

            // Update particle position based on the direction and speed
            particlePositions[i * 3] += direction.x * dustSpeed;
            particlePositions[i * 3 + 2] += direction.y * dustSpeed;
            x = particlePositions[i * 3];
            z = particlePositions[i * 3 + 2];
            // Check if the particle is close enough to the center to reset its position
            if (center.distanceTo(new Vector2(particlePositions[i * 3], particlePositions[i * 3 + 2])) < 1.0) {
                // If the particle is close to the center, reposition it back to a random starting position within the tile boundary
                let x, z;
                do {
                    x = Math.random() * width - width / 2;
                    z = Math.random() * height - height / 2;
                } while (!pointInBounds(x, z, boundary));

                particlePositions[i * 3] = x;
                particlePositions[i * 3 + 2] = z;

                x = particlePositions[i * 3];
                z = particlePositions[i * 3 + 2];
            }


            let y = rowHexagonNoise({ x, y: 0, z }, container.geometry.boundingBox.max.z + .1, 7, width, height, clayNoiseOpts, container);

            // if (y === container.geometry.boundingBox.max.z + .1) y = 0;
            particlePositions[i * 3 + 1] = y;
        }

        // Update the particle geometry with the new positions
        particleGeometry.attributes.position.needsUpdate = true;
    }

    // Step 6: Use alpha blending for particles
    // particleMaterial.blending = AdditiveBlending;
    // particleMaterial.depthTest = false;
    // particleMaterial.depthWrite = false;
    particleGroup.rotation.x = Math.PI / 2;

    return { system: particleGroup, render };
}

export const treeNoiseOpts = {
    amplitudeFactor: 35, frequencyFactor: 2.2, amplitudeExponent1: 3, amplitudeExponent2: 10, fallOffExponent: .12
}

const fbxLoader = new FBXLoader();
let treeObj: Group;
const treeMap = loader.load(treeTexture);
export const generateTreeSystem = async (width: number, height: number, boundary: Vector2[], container: Tile, treeCount = 100) => {

    if (!treeObj)
        treeObj = await fbxLoader.loadAsync(treeModel) as Group;

    const treeGeometry = (treeObj.children[0] as Mesh).geometry;
    const treeMaterial = (treeObj.children[0] as Mesh).material;

    const instancedMesh = new InstancedMesh(treeGeometry, new MeshPhongMaterial({ map: treeMap }), treeCount);


    let x, z;
    let positions: Vector3[] = [];
    const maxMinDistance = 4;
    const minMinDistance = .25;
    const materials = [];

    for (let i = 0; i < treeCount; i++) {
        let position: Vector3;
        let tries = 0;
        let isCenter = false;
        let tooClose = false;
        const scale = Math.random() * (.45 - .25) + 0.25; // Random scale between 1 and 0.5
        const minDistance = (maxMinDistance - minMinDistance) * scale + minMinDistance;

        do {
            let dFromCenter = 0;
            isCenter = false;
            // Generate a random position within the bounds
            do {
                x = Math.random() * width - width / 2;
                z = Math.random() * height - height / 2;
                dFromCenter = Math.hypot(x, z);
            } while (!pointInBounds(x, z, boundary) || dFromCenter < 5);

            // if (y <= container.geometry.boundingBox.max.z + 0.1) {
            //     isCenter = true;
            //     break;
            // }

            position = new Vector3(x, container.mesh.geometry.boundingBox.max.z + .2, z);

            // Check if the position is too close to any existing tree
            tooClose = positions.some(existingPosition => existingPosition.distanceTo(position) < minDistance);

            // If the position is too close, try again
            if (tooClose) {
                tries++;
                if (tries > 100) {
                    // console.warn('Could not find a suitable position for the tree. Skipping.');
                    break;
                }
            }
        } while (tooClose);

        // If we found a suitable position, add it to the list of positions and create the tree instance
        if (!tooClose && !isCenter) {

            const tempMatrix = new Matrix4();

            positions.push(position);

            instancedMesh.setMatrixAt(i, new Matrix4().setPosition(position));

            instancedMesh.getMatrixAt(i, tempMatrix); // Get the matrix of the instance
            tempMatrix.scale(new Vector3(scale, scale, scale)); // Scale down the matrix
            instancedMesh.setMatrixAt(i, tempMatrix); // Apply the scaled matrix back to the instance
        }
    }

    // // Create a new material for each tree instance and assign the loaded texture
    // for (let i = 0; i < instancedMesh.count; i++) {
    //     const material = new MeshBasicMaterial({ map: treeMap });
    //     materials.push(material);
    //     // instancedMesh.setMatrixAt(i, new Matrix4().makeTranslation(0, 0, 0)); // Set the position here
    // }

    // Set the array of materials to the instanced mesh
    // instancedMesh.material = materials;

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.rotation.x = Math.PI / 2;

    return instancedMesh;
}

// const objLoader = new ObjectLoader();
let cactusObj: Group;
let combinedGeom: BufferGeometry;
const cactusDiffuseMap = loader.load(cactusDiffuseTexture);
const cactusNormalMap = loader.load(cactusNormalTexture);
const cactusRoughMap = loader.load(cactusRoughTexture);
const cactusSpikeMap = loader.load(cactusSpikesTexture);

export const generateCactusSystem = async (width: number, height: number, boundary: Vector2[], container: Tile, cactiCount = 20) => {

    if (!cactusObj)
        cactusObj = await fbxLoader.loadAsync(cactusModel) as Group;

    // console.log(cactusObj);

    if (!combinedGeom) {
        var modelGeometry = new Geometry();

        // Create an empty BufferGeometry to hold the combined geometry
        // Loop through the children of the cactusObj
        const geoms = (cactusObj.children.filter(x => x instanceof Mesh) as Mesh[]).map(x => x.geometry) as BufferGeometry[];
        combinedGeom = BufferGeometryUtils.mergeBufferGeometries(geoms);
        combinedGeom.scale(.35, .35, .35);
    }

    const treeGeometry = (cactusObj.children[0] as Mesh).geometry;
    const treeMaterial = (cactusObj.children[0] as Mesh).material;

    const instancedMesh = new InstancedMesh(
        combinedGeom,
        new MeshPhongMaterial({
            // lightMapIntensity: 10,
            map: cactusDiffuseMap,      // Assign the diffuse (albedo) map
            normalMap: cactusNormalMap, // Assign the normal map
            // roughnessMap: cactusRoughMap, // Assign the roughness map
        }),
        cactiCount);

    let x, z;
    let positions: Vector3[] = [];
    const maxMinDistance = 10;
    const minMinDistance = 4;
    const materials = [];

    for (let i = 0; i < cactiCount; i++) {
        let position: Vector3;
        let tries = 0;
        let isCenter = false;
        let tooClose = false;
        const scale = Math.random() * (.45 - .25) + 0.25; // Random scale between 1 and 0.5
        const minDistance = (maxMinDistance - minMinDistance) * scale + minMinDistance;

        do {
            let dFromCenter = 0;
            isCenter = false;
            // Generate a random position within the bounds
            do {
                x = Math.random() * width - width / 2;
                z = Math.random() * height - height / 2;
                dFromCenter = Math.hypot(x, z);
            } while (!pointInBounds(x, z, boundary) || dFromCenter < 7);

            // if (y <= container.geometry.boundingBox.max.z + 0.1) {
            //     isCenter = true;
            //     break;
            // }

            position = new Vector3(x, container.mesh.geometry.boundingBox.max.z + .2, z);

            // Check if the position is too close to any existing tree
            tooClose = positions.some(existingPosition => existingPosition.distanceTo(position) < minDistance);

            // If the position is too close, try again
            if (tooClose) {
                tries++;
                if (tries > 100) {
                    // console.warn('Could not find a suitable position for the tree. Skipping.');
                    break;
                }
            }
        } while (tooClose);

        // If we found a suitable position, add it to the list of positions and create the tree instance
        if (!tooClose && !isCenter) {

            const tempMatrix = new Matrix4();

            positions.push(position);

            instancedMesh.setMatrixAt(i, new Matrix4().setPosition(position));

            instancedMesh.getMatrixAt(i, tempMatrix); // Get the matrix of the instance
            tempMatrix.scale(new Vector3(scale, scale, scale)); // Scale down the matrix
            instancedMesh.setMatrixAt(i, tempMatrix); // Apply the scaled matrix back to the instance
        }
    }

    // // Create a new material for each tree instance and assign the loaded texture
    // for (let i = 0; i < instancedMesh.count; i++) {
    //     const material = new MeshBasicMaterial({ map: treeMap });
    //     materials.push(material);
    //     // instancedMesh.setMatrixAt(i, new Matrix4().makeTranslation(0, 0, 0)); // Set the position here
    // }

    // Set the array of materials to the instanced mesh
    // instancedMesh.material = materials;

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.rotation.x = Math.PI / 2;

    return instancedMesh;
}