import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import cloud from "../../../Assets/Textures/cloud10.png";

export const CreateCloudMaterial = (cloudColor = 0xffffff) => {
  var texture = THREE.ImageUtils.loadTexture(cloud, null);
  texture.magFilter = THREE.LinearMipMapLinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;

  var fog = new THREE.Fog(0x4584b4, 3000, 10000);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      fogColor: { value: fog.color },
      fogNear: { value: fog.near },
      fogFar: { value: fog.far },
      time: { value: 0.0 }, // Add time uniform
      cloudColor: { value: new THREE.Color(cloudColor) }, // Add cloudColor uniform
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;  // Add this line
  
              void main() {
  
                  vUv = uv;
                  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;  // Set world position
                  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
              }
      `,
    fragmentShader: `
      uniform sampler2D map;
  
              uniform vec3 fogColor;
              uniform float fogNear;
              uniform float fogFar;
              uniform float time;  // Add time uniform
              varying vec3 vWorldPosition;  // Add this line
              uniform vec3 cloudColor; // Add cloudColor uniform

              varying vec2 vUv;
  
              float noise(vec2 uv) {
                  // Implement a noise function or use a noise texture
                  return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                }
  
                void main() {
                  float angle = time;  // Adjust swirling speed
                  float s = sin(angle);
                  float c = cos(angle);
                  mat2 rotation = mat2(c, -s, s, c);
                  vec2 uv = rotation * (vUv - 0.5) + 0.5;  // Apply rotation around the center (0.5, 0.5)
                  
                  float depth = vWorldPosition.y;  // Use world y-coordinate instead of fragment depth
                  float fogFactor = smoothstep(fogNear, fogFar, depth);
                  
                  gl_FragColor = texture2D(map, uv);
                  gl_FragColor.w *= pow(gl_FragCoord.z, 20.0);

                  // Apply dynamic cloud color
                  gl_FragColor.rgb = mix(cloudColor, gl_FragColor.rgb, gl_FragColor.w);

                  gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
                
                }
      `,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    side: THREE.DoubleSide,
  });

  return material;
};

export default (
  {
    minX = -500,
    maxX = 500,
    minZ = -200,
    maxZ = 300,
    maxY = 215,
    minY = -15,
  } = { minX: -500, maxX: 500, minZ: -200, maxZ: 300, maxY: 215, minY: -15 }
) => {
  const group = new THREE.Group();
  const geometry = new THREE.Geometry();

  var plane = new THREE.Mesh(new THREE.PlaneGeometry(128, 128)); // adjusted from 64 to 128
  for (var i = 0; i < 500; i++) {
    plane.position.x = Math.random() * (maxX - minX) + minX; // increased range for wider spread along X-axis
    plane.position.y = -Math.random() * Math.random() * (maxY - minY) - minY; // adjusted range
    plane.position.z = Math.random() * (maxZ - minZ) + minZ; // increased range for wider spread along Z-axis
    plane.rotation.z = Math.random() * Math.PI;
    plane.scale.x = plane.scale.z = Math.random() * Math.random() * 2.0 + 1.0; // adjusted scale factor

    THREE.GeometryUtils.merge(geometry, plane);
  }

  const meshes: Array<THREE.Mesh> = [];

  const material = CreateCloudMaterial();

  let mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  meshes.push(mesh);
  mesh.userData["raycast"] = false;
  mesh.raycast = function () {};

  //   mesh = new THREE.Mesh(geometry, material);
  //   mesh.position.z = -8000;
  //   group.add(mesh);
  //   meshes.push(mesh);

  //   group.position.z = 1000;

  //   const axesHelper = new THREE.AxesHelper(50);
  //   axesHelper.position.set(0, 0, 0);
  //   group.add(axesHelper);

  return {
    group,
    update: (dt: number, camera: THREE.Camera, shouldRot: boolean = true) => {
      material.uniforms.time.value += dt * 0.5;

      if (shouldRot)
        meshes.forEach((mesh) => mesh.quaternion.copy(camera.quaternion));
    },
  };
};

export const CreateCloudSea = (cloudColor?: number) => {
  const geometry = new THREE.Geometry();

  const material = CreateCloudMaterial(cloudColor);

  var plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));

  for (var i = 0; i < 8000; i++) {
    plane.position.x = Math.random() * 1000 - 500;
    plane.position.y = -Math.random() * Math.random() * 200 - 15;
    plane.position.z = i;
    plane.rotation.z = Math.random() * Math.PI;
    plane.scale.x = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;

    THREE.GeometryUtils.merge(geometry, plane);
  }

  const meshes = [];
  let mesh = new THREE.Mesh(geometry, material);
  meshes.push(mesh);

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -8000;

  meshes.push(mesh);

  return meshes;
};
