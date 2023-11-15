import {
  ACESFilmicToneMapping,
  BackSide,
  BufferGeometry,
  Camera,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  PointsMaterialParameters,
  Renderer,
  Scene,
  ShaderMaterial,
  Vector3,
} from "three";
import { Sky } from "three/examples/jsm/objects/Sky";
import View from "../../../lib/scene/View";
import * as THREE from "three";
import AnimationManager from "../../../lib/utils/AnimationManager";
import Cloud, { CreateCloudSea } from "./Cloud";

import cloudRight from "../../../Assets/Textures/clouds/bluecloud_rt.jpg";
import cloudLeft from "../../../Assets/Textures/clouds/bluecloud_lf.jpg";
import cloudUp from "../../../Assets/Textures/clouds/bluecloud_up.jpg";
import cloudDown from "../../../Assets/Textures/clouds/bluecloud_dn.jpg";
import cloudFwd from "../../../Assets/Textures/clouds/bluecloud_ft.jpg";
import cloudBack from "../../../Assets/Textures/clouds/bluecloud_bk.jpg";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";

export default () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Load the cubemap textures (assuming the path to your textures is 'textures/cubemap/')
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    cloudFwd,
    cloudBack,
    cloudUp,
    cloudDown,
    cloudRight,
    cloudLeft,
  ]);

  // Set the scene background to the cubemap texture
  scene.background = texture;

  // Create a cube geometry
  // const geometry = new THREE.BoxGeometry();
  // const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);

  // Add lighting (ambient and directional)
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Add the cube to the scene
  // scene.add(cube);

  // Position the camera
  // camera.position.set(0, 0, -10); // Adjust the camera position
  // camera.lookAt(0, 0, 0); // Point the camera at the center of the scene

  return { scene, camera };
};

// const createSkyBox = () => {};

// export default (scene?: View) => {
//   let sky: Sky, sun;

//   // Add Sky
//   sky = new Sky();
//   sky.scale.setScalar(450000);

//   if (scene) scene.container.add(sky);

//   sky.position.set(0, 0, 0);

//   sun = new Vector3();

//   const effectController = {
//     turbidity: 20,
//     rayleigh: 4,
//     mieCoefficient: 0.1,
//     mieDirectionalG: 0.7,
//     elevation: 1,
//     azimuth: 180,
//     exposure: 20,
//   };

//   // scene.renderer.toneMapping = ACESFilmicToneMapping;
//   // scene.renderer.toneMappingExposure = .5; // Adjust the value as needed

//   const uniforms = sky.material.uniforms;
//   uniforms["turbidity"].value = effectController.turbidity;
//   uniforms["rayleigh"].value = effectController.rayleigh;
//   uniforms["mieCoefficient"].value = effectController.mieCoefficient;
//   uniforms["mieDirectionalG"].value = effectController.mieDirectionalG;

//   const phi = MathUtils.degToRad(90 - effectController.elevation);
//   const theta = MathUtils.degToRad(effectController.azimuth);

//   sun.setFromSphericalCoords(1, phi, theta);

//   uniforms["sunPosition"].value.copy(sun);

//   return sky;
// };

export const CreateCloudsScene = async (
  container: HTMLElement,
  cloudColor = 0xffffff,
  fov = 30
) => {
  var canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = window.innerHeight;

  var context = canvas.getContext("2d");

  var gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#000c40"); // Dark blue at the top
  gradient.addColorStop(0.5, "#003366"); // Transition to a lighter blue
  gradient.addColorStop(1, "#000000"); // Black at the bottom

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  container.style.background = "url(" + canvas.toDataURL("image/png") + ")";
  container.style.backgroundSize = "32px 100%";

  const camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    0.1,
    4000
  );

  const scene = new THREE.Scene();

  const meshes = CreateCloudSea(cloudColor);
  const cloudGroups = [meshes[0], meshes[1]];

  scene.add(...cloudGroups);

  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2;
  let position;

  var mouseX = 0,
    mouseY = 0;
  var start_time = Date.now();

  const mousePosition = new THREE.Vector3(0, 0, -8000);
  let targetPitch = 0; // Target pitch angle (rotation around X-axis)
  let targetYaw = 0; // Target yaw angle (rotation around Y-axis)
  let currentPitch = 0; // Current pitch angle
  let currentYaw = 0; // Current yaw angle
  const smoothFactor = 0.025; // Adjust this value to control the speed of the smoothing

  const onMouseMove = (event) => {
    if (!cameraCanRotate) return;
    // Normalize the mouse coordinates to the range [-1, 1]
    const mouseXNormalized = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseYNormalized = -(event.clientY / window.innerHeight) * 2 + 1;

    // Create a Vector3 object to hold the normalized mouse coordinates
    mousePosition.set(mouseXNormalized, mouseYNormalized, 0.5);

    // Calculate target angles based on mouse position
    targetPitch = (mouseYNormalized * Math.PI) / 16; // Adjust the divisor to control the maximum pitch
    targetYaw = (-mouseXNormalized * Math.PI) / 16; // Adjust the divisor to control the maximum yaw
  };

  document.removeEventListener("mousemove", onMouseMove);
  document.addEventListener("mousemove", onMouseMove);

  const sortClouds = (a, b) => a.position.z - b.position.z;
  const distanceBetweenClouds = 8000;

  let cameraCanRotate = true;

  return {
    scene,
    camera,
    cloudGroups,
    update: (dt: number) => {
      position = ((Date.now() - start_time) * 0.03) % 8000;

      camera.position.z = -position;

      if (cameraCanRotate) {
        // Unproject the mouse coordinates from screen space into world space
        mousePosition.unproject(camera);
        mousePosition.setZ(camera.position.z - 100);

        camera.lookAt(mousePosition);

        // Smoothly interpolate current angles towards target angles
        currentPitch += (targetPitch - currentPitch) * smoothFactor;
        currentYaw += (targetYaw - currentYaw) * smoothFactor;

        // Set the camera rotation
        camera.rotation.set(currentPitch, currentYaw, 0);
      }

      // Looping mechanism for clouds
      cloudGroups.forEach((cloud) => {
        // group.children.forEach((cloud) => {
        // Assume clouds move in the negative z-direction
        cloud.position.z -= 0.1; // Adjust speed to your liking

        if (cloud.position.z > camera.position.z + 200) {
          // Find the cloud that is furthest away along the z-axis
          cloudGroups.sort(sortClouds);
          const furthestCloudZ = cloudGroups[0].position.z;

          // Reset cloud position to a point ahead of the furthest cloud (e.g., z = furthestCloudZ - distanceBetweenClouds)
          // Assuming there's a fixed distance between each cloud
          cloud.position.z = furthestCloudZ - distanceBetweenClouds;
        }
        // });
      });
    },
    onLoad: () => {
      position = ((Date.now() - start_time) * 0.03) % 8000;
      camera.position.z = -position + 100;
    },
    documentEvents: [
      {
        event: "mousemove",
        function: onMouseMove,
      },
    ],
    toggleCameraRotation: (canRotate) => (cameraCanRotate = canRotate),
  };
};

export const CreateStarField = (
  topColor = 0x0077ff,
  bottomColor = 0xffffff,
  radius = 500
) => {
  var stars: Array<Points> = [];
  var placedPositions = []; // Array to hold positions of placed galaxy clusters
  function isPositionFarEnough(newPosition) {
    for (let pos of placedPositions) {
      let dx = pos.x - newPosition.x;
      let dy = pos.y - newPosition.y;
      let dz = pos.z - newPosition.z;
      let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < 30) {
        // Assuming a minimum distance of 2000 units
        return false;
      }
    }
    return true;
  }

  const starImage =
    "data:image/png;base64,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";

  let sprite = new THREE.TextureLoader().load(starImage);

  var galaxyColors = [
    "rgba(255, 250, 240, 1)", // Soft white
    "rgba(240, 248, 255, 1)", // Soft blue
    "rgba(255, 239, 213, 1)", // Soft yellow
    "rgba(255, 105, 180, 1)", // Pink
    "rgba(135, 206, 250, 1)", // Light sky blue
    "rgba(147, 112, 219, 1)", // Medium purple
    "rgba(255, 182, 193, 1)", // Light pink
    "rgba(127, 255, 212, 1)", // Aquamarine
  ];

  function getRandomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
  }
  function farRandom(near = 0, far = 2000) {
    const range = far - near;
    return Math.random() * range + near;
  }

  function createCluster(
    geometryCreator,
    quantity,
    size,
    colors,
    positionMultiplier = 1,
    ensureSpread = false,
    clusterType = "galaxy" // New parameter to specify the type of cluster
  ) {
    for (let i = 0; i < quantity; i++) {
      var geometry = geometryCreator(10000, Math.random() * 0.4, clusterType);
      var material = new THREE.PointsMaterial({
        size: Math.random() * size + 1,
        map: sprite,
        depthWrite: false,
        blending:
          Math.random() > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending,
        transparent: true,
        opacity: Math.random(),
      });

      var points = new THREE.Points(geometry, material);

      let newPosition;
      do {
        newPosition = new THREE.Vector3(
          farRandom(-200, 200) * positionMultiplier,
          farRandom(1000, 1025) * positionMultiplier, // Adjusted range for Y-axis
          farRandom(0, -300) * positionMultiplier
        );
      } while (false);
      points.position.set(newPosition.x, newPosition.y, newPosition.z);
      placedPositions.push(newPosition); // Store the position of the placed galaxy cluster

      stars.push(points);
    }
  }

  function createStarGeometry(amount, step, clusterType) {
    var vertices = [];

    for (var i = 1000; i < amount; i += step) {
      var angle = i / 100;
      var distance = clusterType === "galaxy" ? i / 1000 : i / 100; // Adjust distance based on cluster type
      var progress = (i / amount) * 100;
      vertices.push(
        progress * random() * random() * distance,
        progress *
          random() *
          random() *
          (clusterType === "galaxy" ? 1 : distance / 2),
        progress * random() * random() * distance
      );
    }

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    return geometry;
  }

  // Create 18 star clusters with soft white, soft blue, and soft yellow colors
  createCluster(createStarGeometry, 5, 10, galaxyColors, 1, false, "star"); // Specify 'star' for spread-out star clusters

  // Create 6 galaxy clusters with more colorful but realistic colors
  // createCluster(
  //   createRadialStarGeometry,
  //   6,
  //   Math.random() * 1 + 0.5,
  //   galaxyColors,
  //   10,
  //   true
  // );

  function createRadialStarGeometry(amount, step, clusterType) {
    var vertices = [];

    for (var i = 2000; i < amount; i += step) {
      var angle = i / 1000;
      var distance = i / 600;
      var progress = (i / amount) * 4 + 0.5;
      vertices.push(
        progress * random() * random() + Math.sin(angle) * distance,
        progress * random() * random(),
        progress * random() * random() + Math.cos(angle) * distance
      );
    }

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    return geometry;
  }

  function random() {
    return Math.random() * 2 - 1;
  }

  function createStarTexture(from, to) {
    var canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    var context = canvas.getContext("2d");
    var gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
  }

  return stars;
};

export const createStarScene = (
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  ),
  topColor = 0x0077ff,
  bottomColor = 0xffffff,
  radius = 500
) => {
  const _scene = new Scene();
  const stars = CreateStarField(topColor, bottomColor, radius);
  _scene.add(...stars);

  return {
    scene: _scene,
    camera,
    update: (dt: number) => {
      // _scene.position.setZ(camera.position.z);
      // stars.children.forEach((x) => {
      //   if (x instanceof THREE.Points) {
      //     if (x.geometry instanceof BufferGeometry) {
      //       // Obtain the position attribute
      //       let positions = x.geometry.attributes.position;
      //       // Loop through the vertices
      //       for (let i = 0; i < positions.count; i++) {
      //         // Get the current vertex position
      //         let z = positions.getZ(i);
      //         // Check if the star is behind the camera
      //         if (z > camera.position.z + 1000) {
      //           // 2000 is an arbitrary distance ahead of the camera
      //           positions.setZ(
      //             i,
      //             camera.position.z - Math.random() * 1000
      //           ); // Reposition star in front of the camera
      //         //   positions.setX(i, THREE.MathUtils.randFloatSpread(2000));
      //         //   positions.setY(i, THREE.MathUtils.randFloatSpread(camera.position.y));
      //         }
      //       }
      //       // Notify Three.js that the position attribute needs to be updated
      //       positions.needsUpdate = true;
      //     } else {
      //       (x.geometry as THREE.Geometry).vertices.forEach((p) => {
      //         // Check if the star is behind the camera
      //         if (p.z < camera.position.z - 2000) {
      //           // 2000 is an arbitrary distance ahead of the camera
      //           p.setZ(camera.position.z - Math.random() * 1000); // Reposition star in front of the camera
      //           p.setX(THREE.MathUtils.randFloatSpread(2000));
      //           p.setY(THREE.MathUtils.randFloatSpread(2000));
      //         }
      //       });
      //       (x.geometry as THREE.Geometry).verticesNeedUpdate = true;
      //     }
      //   }
      // });
    },
    onLoad: (
      scene: Scene | Array<Scene>,
      camera: Camera,
      renderer: Renderer,
      am: AnimationManager
    ) => {
      _scene.position.copy(camera.position);
    },
  };
};
