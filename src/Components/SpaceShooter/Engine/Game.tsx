import * as THREE from "three";
import { CreateCloudsScene } from "../../Catan/Environment/Sky";
import crosshairT from "../../../Assets/Textures/crosshairs/circle/circle-03-whole.png";

import * as CANNON from "cannon";

//@ts-ignore
import shipModel from "../../../Assets/Models/ships/felsar/Feisar.fbx";
//@ts-ignore
// import shipTexture from "../../../Assets/Models/ships/felsar/Feisar_Ship.mtl";
import diffuseMapTexture from "../../../Assets/Models/ships/felsar/diffuse.bmp";
import specularMapTexture from "../../../Assets/Models/ships/felsar/specular.bmp";

import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { TextureLoader } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Cloud from "../../Catan/Environment/Cloud";
// import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";

export default async (
  container: HTMLElement,
  onMissilesUpdated?: (numMissilesAvailable, maxMissilesAvailable) => void,
  onPause?: (toggled: boolean) => void,
  onLock?: (locked: boolean) => void,
  cloudColor = 0xffffff
) => {
  //#region Scene Init
  const {
    scene,
    camera,
    update: cloudUpdate,
    onLoad: cloudOnLoad,
    documentEvents: cloudDocEvents,
    cloudGroups,
  } = await CreateCloudsScene(container, cloudColor, 45);

  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2;

  const loader = new FBXLoader();
  const spaceshipModelGroup: THREE.Group = await loader.loadAsync(shipModel);
  const textureLoader = new THREE.TextureLoader();
  const specularMap = await textureLoader.loadAsync(specularMapTexture);
  const diffuseMap = await textureLoader.loadAsync(diffuseMapTexture);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const mat = (
    (
      spaceshipModelGroup.children[
        spaceshipModelGroup.children.length - 1
      ] as THREE.Mesh
    ).material as THREE.MeshPhongMaterial
  ).clone();
  mat.specularMap = specularMap;
  mat.map = diffuseMap;

  const spaceship = new THREE.Group();

  let spaceshipMesh = new THREE.Mesh(
    (
      spaceshipModelGroup.children[
        spaceshipModelGroup.children.length - 1
      ] as THREE.Mesh
    ).geometry
      .clone()
      .rotateX(Math.PI)
      .rotateZ(Math.PI),
    mat
  );
  spaceshipMesh.scale.set(0.1, 0.1, 0.1);
  spaceshipMesh.position.z = 0; // Position the spaceship slightly in front of the camera
  spaceship.add(spaceshipMesh);
  scene.add(spaceship); // Add the spaceship to the scene

  const cubeBounds = new THREE.BoxGeometry(1000, 50, 600);
  cubeBounds.computeBoundingBox();
  const boundMat = new THREE.MeshBasicMaterial({ wireframe: true });
  const boundCube = new THREE.Mesh(cubeBounds, boundMat);
  scene.add(boundCube);

  const { group: eastGroup, update: eastUpdate } = Cloud({
    maxY: -200,
    minY: 100,
  });
  const { group: westGroup, update: westUpdate } = Cloud({
    maxY: -200,
    minY: 100,
  });

  const wallClouds = [eastGroup, westGroup];
  const wallBoundUpdates = [eastUpdate, westUpdate];

  // scene.add(...wallClouds);

  // Load the crosshair texture
  const crosshairTexture = new THREE.TextureLoader().load(crosshairT);

  // Create a sprite material with the crosshair texture
  const crosshairMaterial = new THREE.SpriteMaterial({ map: crosshairTexture });

  // Create the crosshair sprite
  const crosshair = new THREE.Sprite(crosshairMaterial);
  crosshair.scale.set(20, 20, 20);

  // Set the initial position of the crosshair relative to the spaceship
  crosshair.position.set(0, 0, -100); // Adjust z-value as needed to position the crosshair in front of the spaceship

  // Add the crosshair as a child of the spaceship
  spaceship.add(crosshair);

  // Create a physics world
  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0); // m/s²
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  var fixedTimeStep = 1.0 / 60.0; // seconds
  var maxSubSteps = 3;

  let start_time = Date.now();

  const wallBounds = new THREE.Box3().setFromObject(wallClouds[0]);
  const bounds = boundCube.geometry.boundingBox;
  //#endregion

  //#region Ship and Camera Position
  let shipZPosition = 0; // Initial value
  const maxShipPitchAngle = Math.PI / 6;
  const maxShipPitchAngleWithThrust = Math.PI / 4;
  const maxShipYawAngle = Math.PI / 12;
  const maxShipYawAngleWithThrust = Math.PI / 6;
  const maxShipRollAngle = Math.PI / 3;
  const maxShipRollAngleWithThrust = Math.PI / 2;
  let currentAcceleration = acceleration; // assuming acceleration is defined elsewhere
  const maxVelocityZ = 15; // Set your desired maximum velocity
  const minVelocityZ = 1; // Adjust to your liking
  // Define velocity and acceleration outside the update function
  var velocityX = 0,
    velocityY = 0,
    velocityZ = 0,
    acceleration = 0.01; // Adjust acceleration value to control the "heaviness" of the spaceship
  var damping = 0.7; // Adjust damping value to control the rate of deceleration
  var mass = 2; // Set a mass value for the ship.
  var inertia = 0.1; // Set an inertia value.
  const rotationSmoothing = 0.05; // Adjust smoothing to your liking.
  let lastPitchTime = Date.now();
  let lastThrustTime = Date.now();

  const updateDirectionalInput = () => {
    const thrust = 1; // Assume a unit thrust value for simplicity

    // Update velocity based on the state of DirectionalButtonInput
    if (
      DirectionalButtonInput.UP ||
      DirectionalButtonInput.DOWN ||
      DirectionalButtonInput.LEFT ||
      DirectionalButtonInput.RIGHT
    ) {
      // Update velocity based on the state of DirectionalButtonInput
      if (DirectionalButtonInput.LEFT) velocityX -= (thrust * 2) / mass;
      if (DirectionalButtonInput.RIGHT) velocityX += (thrust * 2) / mass;
      if (DirectionalButtonInput.UP) velocityY += thrust / mass;
      if (DirectionalButtonInput.DOWN) velocityY -= thrust / mass;

      // Update the last thrust time whenever thrust is applied
      lastThrustTime = Date.now();
    }
  };

  const adjustPitchAndThrust = () => {
    const oppositeVerticalDirection =
      (DirectionalButtonInput.UP && spaceship.rotation.x < 0) ||
      (DirectionalButtonInput.DOWN && spaceship.rotation.x > 0);

    // const oppositeHorizontalDirection =
    //   (DirectionalButtonInput.LEFT && spaceship.rotation.y < 0) ||
    //   (DirectionalButtonInput.RIGHT && spaceship.rotation.y > 0);

    if (oppositeVerticalDirection) {
      // Adjust pitch towards 0 (level) when thrust and pitch are in opposite directions
      spaceship.rotation.x -= spaceship.rotation.x * rotationSmoothing;
      mouseY *= damping;
    }

    // if (oppositeHorizontalDirection) {
    //   spaceship.rotation.y -= spaceship.rotation.y * rotationSmoothing;
    //   mouseX *= damping;
    // }

    // const timeSinceLastThrust = Date.now() - lastThrustTime;
    // const timeSinceLastPitch = Date.now() - lastPitchTime;

    // // Assume a threshold time of 2 seconds (2000 milliseconds) after which the pitch will start to level out
    // const levelOutThreshold = 1000;
    // const pitchThreshold = maxShipPitchAngle / 1.1; // Adjust this value to control the pitch threshold

    // if (
    //   timeSinceLastThrust > levelOutThreshold &&
    //   timeSinceLastPitch > levelOutThreshold &&
    //   Math.abs(spaceship.rotation.x) > pitchThreshold
    // ) {
    //   // Apply a leveling force to gradually return the ship to a level pitch
    //   // Adjust the 0.01 value to control the rate at which the ship levels out
    //   spaceship.rotation.x -=
    //     spaceship.rotation.x *
    //     rotationSmoothing *
    //     rotationSmoothing *
    //     rotationSmoothing;
    //   mouseY *= damping;
    // }
  };
  const rollThreshold = 0.1; // Define a small threshold value

  const updateShipPosition = () => {
    if (!canUpdate) {
      crosshair.visible = false;
    } else {
      crosshair.visible = true;
    }

    // Apply damping to velocity
    velocityY *= damping;
    velocityX *= damping;

    let pitchFromVelocity = THREE.MathUtils.clamp(
      velocityY * 50,
      ((-maxShipPitchAngle / 3) * windowHalfY) / (Math.PI / 2),
      ((maxShipPitchAngle / 3) * windowHalfY) / (Math.PI / 2)
    );

    const pitchAmount = pitchFromVelocity - mouseY;

    // if (isLeftDown && Math.abs(clickedMouseY) > Math.abs(clickedMouseX)) {
    const targetPitch = THREE.MathUtils.clamp(
      (pitchAmount / windowHalfY) * (Math.PI / 2),
      // DirectionalButtonInput.UP || DirectionalButtonInput.DOWN
      //   ? -maxShipPitchAngleWithThrust
      //   :
      -maxShipPitchAngle,
      // DirectionalButtonInput.UP || DirectionalButtonInput.DOWN
      //   ? maxShipPitchAngleWithThrust
      //   :
      maxShipPitchAngle
    ); // Clamps the rotation between -π/2 and π/2 (±90 degrees)
    // Apply pitch (rotation around X axis)
    spaceship.rotation.x +=
      (targetPitch - spaceship.rotation.x) * rotationSmoothing;
    // }

    const oppositeHorizontalDirection =
      (DirectionalButtonInput.LEFT && mouseX > 0) ||
      (DirectionalButtonInput.RIGHT && mouseX < 0);

    const sameHorizontalDirection =
      (DirectionalButtonInput.LEFT || DirectionalButtonInput.RIGHT) &&
      Math.abs(mouseX) > 0;

    let yawFromVelocity = THREE.MathUtils.clamp(
      -velocityX * 50,
      (((oppositeHorizontalDirection
        ? -maxShipYawAngleWithThrust
        : -maxShipYawAngle) /
        3) *
        windowHalfX) /
        (Math.PI / 2),
      (((oppositeHorizontalDirection
        ? maxShipYawAngleWithThrust
        : maxShipYawAngle) /
        3) *
        windowHalfX) /
        (Math.PI / 2)
    );

    const yawAmount = yawFromVelocity - mouseX;

    if (!isLeftDown) {
      // Calculate targetYaw based on mouse input
      const targetYaw = THREE.MathUtils.clamp(
        (yawAmount / windowHalfX) * (Math.PI / 2),
        oppositeHorizontalDirection
          ? -maxShipYawAngleWithThrust
          : -maxShipYawAngle,
        oppositeHorizontalDirection
          ? maxShipYawAngleWithThrust
          : maxShipYawAngle
      );

      // Apply yaw (rotation around Y axis)
      spaceship.rotation.y +=
        (targetYaw - spaceship.rotation.y) * rotationSmoothing;
    } else {
      spaceship.rotation.y = THREE.MathUtils.lerp(
        spaceship.rotation.y,
        0,
        rotationSmoothing
      );

      mouseX *= damping;
    }

    if (
      isLeftDown ||
      // && Math.abs(clickedMouseX) > Math.abs(clickedMouseY)
      turboActive
    ) {
      const targetRoll = THREE.MathUtils.clamp(
        ((isLeftDown ? -clickedMouseX : -mouseX) / windowHalfX) * (Math.PI / 2),
        sameHorizontalDirection
          ? -maxShipRollAngleWithThrust
          : -maxShipRollAngle,
        sameHorizontalDirection ? maxShipRollAngleWithThrust : maxShipRollAngle
      ); // Clamps the rotation between -π/2 and π/2 (±90 degrees)
      // Apply the roll rotation
      spaceship.rotation.z +=
        (targetRoll - spaceship.rotation.z) * rotationSmoothing;
    } else {
      if (!isLeftDown) {
        spaceship.rotation.z = THREE.MathUtils.lerp(
          spaceship.rotation.z,
          0,
          rotationSmoothing
        );

        clickedMouseX *= damping;
      }

      // if (Math.abs(spaceship.rotation.z) > rollThreshold) {
      //   clickedMouseX *= damping;
      // }
    }

    // Calculate forwardThrust based on the ship's pitch and velocityY
    const forwardThrust = Math.cos(spaceship.rotation.x) * acceleration;

    // Split the forwardThrust into horizontal and vertical components based on both pitch and yaw
    const verticalThrust = Math.sin(spaceship.rotation.x) * forwardThrust;
    const horizontalThrust = Math.sin(spaceship.rotation.y) * forwardThrust;

    // Directly add the keyboard thrust to the pitch and yaw-derived thrust
    const totalVerticalThrust = velocityY + verticalThrust;
    const totalHorizontalThrust = velocityX + horizontalThrust;

    // Calculate a pitch-based vertical movement
    // Adjust the multiplier (e.g., 0.5 here) to control the effect of pitch on vertical movement
    const pitchBasedVerticalMovement = Math.sin(spaceship.rotation.x) * 2;
    const yawBasedHorizontalMovement = Math.sin(spaceship.rotation.y) * 2;

    // Calculate a roll-based horizontal movement
    // Adjust the multiplier (e.g., 0.5 here) to control the effect of roll on horizontal movement
    const rollBasedHorizontalMovement = Math.sin(spaceship.rotation.z) * 0.5;

    // Update the ship's position along the Y-axis based on the vertical thrust
    let newPosY =
      spaceship.position.y + totalVerticalThrust + pitchBasedVerticalMovement;
    spaceship.position.y = Math.min(
      Math.max(newPosY, bounds.min.y),
      bounds.max.y
    );

    if (
      Math.abs(spaceship.position.y - bounds.max.y) < 5 ||
      Math.abs(spaceship.position.y - bounds.min.y) < 5
    ) {
      spaceship.rotation.x = THREE.MathUtils.lerp(
        spaceship.rotation.x,
        0,
        rotationSmoothing
      );
    }

    // Update the ship's position along the X-axis based on the horizontal thrust, yaw, and roll
    let newPosX =
      spaceship.position.x +
      totalHorizontalThrust +
      -yawBasedHorizontalMovement +
      -rollBasedHorizontalMovement;
    spaceship.position.x = Math.min(
      Math.max(newPosX, bounds.min.x),
      bounds.max.x
    );

    if (turboActive || brakesActive) {
      // Accelerate forward when the right mouse button is held down
      //   const elapsedTime = (Date.now() - rightDownTime) / 1000; // Time in seconds
      //   currentAcceleration = THREE.MathUtils.lerp(
      //     acceleration,
      //     acceleration * 2,
      //     elapsedTime / 10
      //   ); // Adjust the lerp factor (10 here) to control the rate of acceleration increase
      // Accelerate forward when the right mouse button is held down
      if (turboActive) velocityZ += currentAcceleration * 10;
      // Adjust multiplier (100 here) to your liking
      else if (brakesActive) velocityZ -= currentAcceleration * 20; // Adjust multiplier (100 here) to your liking
      // Clamp the velocity to the maximum value
      velocityZ = Math.min(Math.max(velocityZ, 0), maxVelocityZ);
    } else {
      velocityZ = THREE.MathUtils.lerp(
        velocityZ,
        hasLocked ? minVelocityZ : 0,
        0.5
      ); // Adjust the lerp factor (0.05 here) to control the rate of deceleration
      currentAcceleration = acceleration; // Reset acceleration
    }
    shipZPosition -= velocityZ;
    spaceship.position.z = shipZPosition;

    adjustPitchAndThrust();
  };

  // Define some variables for the camera follow behavior
  let targetCameraPosition = new THREE.Vector3();
  // Define some variables for the camera rotation
  let targetCameraRotation = new THREE.Euler();

  let shouldCheckTimeout = false;
  let lastCheckTime = 0;
  let offsetTarget = 50;
  const updateCameraPosition = (checkState = true) => {
    if (checkState) {
      if (!canUpdate) return;
    }

    let crosshairGlobalPosition = crosshair
      .getWorldPosition(new THREE.Vector3())
      .clone();
    crosshairGlobalPosition = crosshairGlobalPosition.setY(
      crosshairGlobalPosition.y + (turboActive ? 10 : 10)
    );
    const shipGlobalPosition = spaceshipMesh.getWorldPosition(
      new THREE.Vector3()
    );
    let cameraRotationSpeed = hasLocked ? (turboActive ? 0.09 : 0.05) : 0.075; // Adjust speed to your liking
    let cameraFollowSpeed = hasLocked ? (turboActive ? 0.05 : 0.05) : 0.075; // Adjust speed to your liking

    const offset = hasLocked ? (turboActive ? 0 : brakesActive ? 75 : 125) : 50;

    offsetTarget = THREE.MathUtils.lerp(
      offsetTarget,
      offset,
      turboActive ? 0.25 : 0.5
    );

    // Calculate overshoot values for camera position
    targetCameraPosition
      .copy(shipGlobalPosition)
      .setY(spaceship.position.y + (turboActive ? 0 : 0));

    targetCameraPosition.z += offsetTarget; // Adjust offset to your liking

    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(
      spaceship.quaternion
    );

    const cameraOffset = forwardVector.multiplyScalar(-offsetTarget); // -150 is the distance behind the ship
    targetCameraPosition
      .copy(
        shipGlobalPosition
          .clone()
          .setY(spaceship.position.y + (turboActive || brakesActive ? 20 : 20))
      )
      .add(cameraOffset);

    // Smoothly interpolate the camera position
    camera.position.lerp(targetCameraPosition, cameraFollowSpeed);

    // Look at the spaceship

    // Calculate the desired camera rotation based on the spaceship's orientation
    targetCameraRotation.copy(spaceship.rotation);

    // Smoothly interpolate the camera rotation
    camera.rotation.x = THREE.MathUtils.lerp(
      camera.rotation.x,
      targetCameraRotation.x,
      cameraRotationSpeed
    );
    camera.rotation.y = THREE.MathUtils.lerp(
      camera.rotation.y,
      targetCameraRotation.y,
      cameraRotationSpeed
    );
    camera.rotation.z = THREE.MathUtils.lerp(
      camera.rotation.z,
      targetCameraRotation.z,
      cameraRotationSpeed
    );

    camera.lookAt(crosshairGlobalPosition);
  };
  //#endregion

  //#region Ammo
  let maxMissiles = 10;
  let currentMissiles = maxMissiles;
  let lastFiredTime = 0;
  let lastAmmoRefreshTime = 0;
  const missilePool = [];

  const fireMissile = () => {
    if (currentMissiles > 0) {
      // Checking cooldown
      let missile;
      if (missilePool.length > 0) {
        missile = createNewMissile(missilePool.pop()); // Reuse missile from pool
      } else {
        missile = createNewMissile(); // Create new missile
      }
      // ... (rest of your missile firing code)
      lastFiredTime = Date.now();
      currentMissiles--;

      // Create a physics body for the missile
      const missileBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(
          missile.position.x,
          missile.position.y,
          missile.position.z
        ),
        shape: new CANNON.Cylinder(0.5, 0.5, 2, 8), // Adjust these parameters to match your missile's geometry
      });

      missileBody.quaternion.copy(spaceship.quaternion);

      // Get the crosshair's global position
      const crosshairGlobalPosition = crosshair
        .getWorldPosition(new THREE.Vector3())
        .clone();

      // Compute the direction vector from the spaceship to the crosshair
      const direction = crosshairGlobalPosition
        .clone()
        .sub(missile.position)
        .normalize();

      // Scale the direction vector by the missile speed to get the velocity vector
      const missileSpeed = 600; // Adjust missile speed as needed
      const velocity = direction.multiplyScalar(missileSpeed);

      // Set the missile's initial velocity
      missileBody.velocity.set(velocity.x, velocity.y, velocity.z);

      missileBody.damping = 0.9;

      // Add the physics body to the world
      world.addBody(missileBody);

      // Store the physics body with the missile for later use
      missile.userData.physicsBody = missileBody;

      scene.add(missile);
      missiles.push(missile);

      if (onMissilesUpdated !== undefined)
        onMissilesUpdated(currentMissiles, maxMissiles);
    }
  };

  // Create a geometry and material for the missiles/rockets
  const missileGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16); // adjust dimensions as needed
  missileGeometry.rotateX(Math.PI / 2);
  const missileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // red color

  // Array to store active missiles/rockets
  const missileRange = 600; // Set your desired range
  const missiles = [];
  const createNewMissile = (missile?: THREE.Mesh) => {
    if (!missile) missile = new THREE.Mesh(missileGeometry, missileMaterial);
    missile.position.copy(spaceship.position);
    missile.rotation.copy(spaceship.rotation);

    missilePool.push(missile);

    return missile;
  };

  const updateMissles = () => {
    if (!canUpdate) return;

    if ((isRightDown && !isLeftDown) || isSpaceDown) {
      fireMissile();
    }

    // Update the position and rotation of each missile based on the physics simulation
    for (let i = missiles.length - 1; i >= 0; i--) {
      // Loop backwards so we can remove missiles while iterating
      const missile = missiles[i];
      const body = missile.userData.physicsBody;
      missile.position.copy(body.position);
      missile.quaternion.copy(body.quaternion);

      // Check if the missile has gone out of range
      const distanceFromCamera = camera.position.distanceTo(missile.position);
      if (distanceFromCamera > missileRange) {
        // Replace 3000 with whatever range you want
        // Remove the missile from the scene
        scene.remove(missile);

        // Remove the missile's physics body from the world
        world.removeBody(body);

        // Remove the missile from the missiles array
        missiles.splice(i, 1);
      }
    }

    const currentTime = Date.now();
    if (
      currentTime - lastFiredTime > 1000 &&
      currentTime - lastAmmoRefreshTime > 1000
    ) {
      if (currentMissiles < maxMissiles) {
        currentMissiles++;
        lastAmmoRefreshTime = currentTime;
        if (onMissilesUpdated !== undefined)
          onMissilesUpdated(currentMissiles, maxMissiles);
      }
    }
  };
  //#endregion

  //#region Clouds
  const sortClouds = (a, b) => a.position.z - b.position.z;
  const distanceBetweenClouds = 8000;
  let cloudOffsetTarget;
  const updateCloudBounds = (dt?: number) => {
    // Looping mechanism for clouds
    cloudGroups.forEach((cloud) => {
      // Assume clouds move in the negative z-direction

      const offset = hasLocked
        ? turboActive
          ? -20
          : brakesActive
          ? -5
          : -10
        : -10; // Adjust speed to your liking

      if (cloudOffsetTarget === undefined) cloudOffsetTarget = offset;

      cloudOffsetTarget = THREE.MathUtils.lerp(
        cloudOffsetTarget,
        offset,
        turboActive ? 0.05 : 0.5
      );

      cloud.position.z -= cloudOffsetTarget;

      // Check if cloud has moved past a certain point (e.g., z = camera.position.z + 200)
      if (cloud.position.z > camera.position.z + 200) {
        // Find the cloud that is furthest away along the z-axis
        cloudGroups.sort(sortClouds);
        const furthestCloudZ = cloudGroups[0].position.z;

        // Reset cloud position to a point ahead of the furthest cloud (e.g., z = furthestCloudZ - distanceBetweenClouds)
        // Assuming there's a fixed distance between each cloud
        cloud.position.z = furthestCloudZ - distanceBetweenClouds;
      }
    });

    boundCube.position.z = shipZPosition - 350;

    wallClouds[0].position.z = shipZPosition - (bounds.max.z - bounds.min.z);
    wallClouds[0].position.setX(
      bounds.min.x - (wallBounds.max.x - wallBounds.min.x) / 2.5
    );
    wallClouds[1].position.z = shipZPosition - (bounds.max.z - bounds.min.z);
    wallClouds[1].position.setX(
      bounds.max.x + (wallBounds.max.x - wallBounds.min.x) / 2.5
    );

    if (dt) {
      wallBoundUpdates.forEach((e) => e(dt, camera, true));
    }
  };
  //#endregion

  //#region Update

  //   const updateMousePositionDamping = () => {
  //     const currentTime = Date.now();
  //     const timeSinceLastMove = currentTime - lastMouseMoveTime;

  //     // If there's been no mouse movement for a certain amount of time, start damping the mouseX and mouseY values
  //     if (timeSinceLastMove > 100) {
  //       // 100ms threshold, adjust as needed
  //       const dampingFactor = 0.9; // Adjust damping factor as needed
  //       mouseX *= dampingFactor;
  //       mouseY *= dampingFactor;
  //     }
  //   };

  let canUpdate = false;

  const updateSceneObjs = (dt?: number) => {
    // updateMousePositionDamping();

    canUpdate = !(
      !isInit ||
      document.pointerLockElement !== parent ||
      isPaused ||
      !hasLocked
    );

    updateDirectionalInput();

    updateShipPosition();

    updateCameraPosition(false);

    updateCloudBounds(dt);

    updateMissles();
  };

  let isPaused = true;

  let isInit = false;

  const togglePause = (paused: boolean) => {
    const toggle = async () => {
      if (paused && !isPaused) {
        isPaused = true;
        hasLocked = false;
        isRequesting = false;
        hasRequested = false;
        isLeftDown = false;
        isRightDown = false;
        turboActive = false;
        brakesActive = false;
        leftDownTime = 0;
        rightDownTime = 0;
        mouseX = mouseY = clickedMouseX = clickedMouseY = 0;

        if (onPause) onPause(true);
        if (onLock) onLock(false);

        return;
      }

      if (!paused && isPaused) {
        if (onPause) onPause(false);
        isPaused = false;
        hasRequested = true;
        isRequesting = false;
      } else if (
        !paused &&
        document.pointerLockElement !== parent &&
        hasRequested &&
        !isRequesting
      ) {
        isRequesting = true;
        try {
          await parent.requestPointerLock();
        } catch (err) {
          isRequesting = false;
        }
      }
    };

    toggle();
  };

  let hasRequested = false;
  let isRequesting = false;

  let parent: HTMLElement = container;
  let next = parent;
  do {
    next = next.parentElement;
    if (next !== null) parent = next;
  } while (next != null);

  let hasStarted = false;
  //#endregion

  //#region Document Listeners

  let mouseX = 0,
    mouseY = 0,
    clickedMouseX = 0,
    clickedMouseY = 0;
  let lastMouseMoveTime = 0;
  let lastXDir = "none";
  const onDocumentMouseMove = (event) => {
    if (!canUpdate) {
      mouseX = mouseY = clickedMouseX = clickedMouseY = 0;
      return;
    }

    if (!boundCube.geometry.boundingBox) return;

    lastMouseMoveTime = Date.now();

    // if (Math.abs(event.movementY) > 1) {
    //   lastPitchTime = Date.now();
    // }

    if (isLeftDown || isRightDown) {
      const sameHorizontalRollDirection =
        (DirectionalButtonInput.LEFT || DirectionalButtonInput.RIGHT) &&
        Math.abs(clickedMouseX) > 0;

      clickedMouseX += event.movementX * 0.25;

      clickedMouseX = THREE.MathUtils.clamp(
        clickedMouseX,
        ((sameHorizontalRollDirection
          ? -maxShipRollAngleWithThrust
          : -maxShipRollAngle) *
          windowHalfX) /
          (Math.PI / 2),
        ((sameHorizontalRollDirection
          ? maxShipRollAngleWithThrust
          : maxShipRollAngle) *
          windowHalfX) /
          (Math.PI / 2)
      );
      clickedMouseY += event.movementY * 0.15;
    }

    // Update mouseX and mouseY with the mouse movement, then clamp the values
    // if (!isRightDown || turboActive) {
    // if (Math.abs(event.movementX) > 0) {
    // let curDir = event.movementX > 0 ? "right" : "left";
    // if (lastXDir !== "none" && lastXDir !== curDir && Math.abs(event.movementX) > 1)
    //   mouseX = event.movementX * 0.25;
    // else

    // mouseX += event.movementX * 0.25;
    // lastXDir = curDir;
    const sameHorizontalDirection =
      (DirectionalButtonInput.LEFT || DirectionalButtonInput.RIGHT) &&
      Math.abs(mouseX) > 0;

    mouseX += event.movementX * 0.25;

    mouseX = THREE.MathUtils.clamp(
      mouseX,
      ((sameHorizontalDirection
        ? -maxShipYawAngleWithThrust
        : -maxShipYawAngle) *
        windowHalfX) /
        (Math.PI / 2),
      ((sameHorizontalDirection ? maxShipYawAngleWithThrust : maxShipYawAngle) *
        windowHalfX) /
        (Math.PI / 2)
    );
    // }
    // }

    mouseY += event.movementY * 0.15;

    // const crossWorld = scene
    //   .getWorldPosition(spaceshipMesh.position.clone())
    //   .applyQuaternion(spaceship.quaternion);

    // Reset mouseX and mouseY to zero if the spaceship is at the bounds
    // if (
    //   (crossWorld.x <= bounds.min.x && mouseX < 0) ||
    //   (crossWorld.x >= bounds.max.x && mouseX > 0)
    //   //   (crossWorld.x <= bounds.min.x && mouseX < 0) ||
    //   //   (crossWorld.x >= bounds.max.x && mouseX > 0)
    // ) {
    //   mouseX = 0;
    // }
    // if (
    //   (crossWorld.y <= bounds.min.y && mouseY < 0) ||
    //   (crossWorld.y >= bounds.max.y && mouseY > 0)
    //   //   (crossWorld.y <= bounds.min.y && mouseY < 0) ||
    //   //   (crossWorld.y >= bounds.max.y && mouseY > 0)
    // ) {
    //   mouseY = 0;
    // }
  };

  let isRightDown = false;
  let isLeftDown = false;
  let rightDownTime = 0;
  let leftDownTime = 0;
  function onPointerDown(event) {
    if (!canUpdate) return;

    if (event.button == 0) {
      isLeftDown = true;
      leftDownTime = Date.now();
    }

    if (event.button == 2) {
      isRightDown = true;
      rightDownTime = Date.now();
    }
  }

  function onPointerUp(event) {
    if (!canUpdate) {
      isRightDown = false;
      rightDownTime = 0;
      isLeftDown = false;
      leftDownTime = 0;
      return;
    }

    if (event.button == 2) {
      isRightDown = false;
      rightDownTime = 0;
    }

    if (event.button == 0) {
      isLeftDown = false;
      leftDownTime = 0;
    }
  }

  let hasLocked = false;

  //   const onPauseClick = (event) => {
  //     if (document.pointerLockElement !== parent) {
  //       parent.requestPointerLock();
  //       return;
  //     }
  //   };

  const DirectionalButtonInput = {
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
  };
  let isSpaceDown = false;

  const onKeyDown = (e) => {
    if (!canUpdate) return;

    if (e.key === "w" || e.key === "ArrowUp") {
      DirectionalButtonInput.UP = true;
    }

    if (e.key === "s" || e.key === "ArrowDown") {
      DirectionalButtonInput.DOWN = true;
    }

    if (e.key === "a" || e.key === "ArrowLeft") {
      DirectionalButtonInput.LEFT = true;
    }

    if (e.key === "d" || e.key === "ArrowRight") {
      DirectionalButtonInput.RIGHT = true;
    }

    if (e.key === " ") {
      isSpaceDown = true;
    }
  };

  const onKeyUp = (e) => {
    if (!canUpdate) return;

    if (e.key === "w" || e.key === "ArrowUp") {
      DirectionalButtonInput.UP = false;
    }

    if (e.key === "s" || e.key === "ArrowDown") {
      DirectionalButtonInput.DOWN = false;
    }

    if (e.key === "a" || e.key === "ArrowLeft") {
      DirectionalButtonInput.LEFT = false;
    }

    if (e.key === "d" || e.key === "ArrowRight") {
      DirectionalButtonInput.RIGHT = false;
    }

    if (e.key === " ") {
      isSpaceDown = false;
    }
  };

  let turboActive = false;
  let brakesActive = false;
  let lastScrollTime = 0;
  const scrollCooldown = 500; // 500ms cooldown

  const onMouseWheel = (e) => {
    if (!canUpdate) return;

    const currentTime = Date.now();
    if (currentTime - lastScrollTime < scrollCooldown) {
      return; // Ignore the scroll event if it's within the cooldown period
    }

    lastScrollTime = currentTime; // Update the last scroll time

    if (e.deltaY < 0) {
      if (brakesActive) {
        brakesActive = false;
        return;
      }

      turboActive = true;
    }

    if (e.deltaY > 0) {
      if (turboActive) {
        turboActive = false;
        return;
      }

      brakesActive = true;
    }
  };

  document.removeEventListener("mousemove", cloudDocEvents[0].function);
  document.removeEventListener("mousemove", onDocumentMouseMove);
  document.removeEventListener("mousedown", onPointerDown);
  document.removeEventListener("mouseup", onPointerUp);
  document.removeEventListener("keyup", onKeyUp);
  document.removeEventListener("keydown", onKeyDown);
  document.removeEventListener("wheel", onMouseWheel);

  document.addEventListener("mousemove", onDocumentMouseMove);
  document.addEventListener("mousedown", onPointerDown);
  document.addEventListener("mouseup", onPointerUp);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("wheel", onMouseWheel);

  //#endregion

  return {
    scene,
    camera,
    setInit: () => {
      start_time = Date.now();
      isInit = true;
    },
    togglePause,
    update: (dt: number) => {
      if (document.pointerLockElement !== parent) {
        if (!isPaused && !hasRequested && !isRequesting && isInit) {
          togglePause(true);
        } else if (!isPaused && hasRequested && !isRequesting && isInit) {
          togglePause(false);
        }
      } else {
        if (isPaused && isInit) {
          togglePause(false);
        }

        if (!hasLocked && isInit) {
          if (onLock) onLock(true);
          hasLocked = true;
          isRequesting = false;
          hasRequested = false;
        }

        if (!hasStarted) hasStarted = true;
      }

      if (hasStarted) {
        world.step(fixedTimeStep, dt, maxSubSteps);
        //   position += (dt * speedFactor) % 8000;
      }

      updateSceneObjs(dt);
    },
    onLoad: () => {
      let position = ((Date.now() - start_time) * 0.03) % 8000;
      shipZPosition = -position - 400; // Initial value
      updateSceneObjs();

      if (onMissilesUpdated) onMissilesUpdated(currentMissiles, maxMissiles);
    },

    documentEvents: [
      {
        event: "mousemove",
        function: onDocumentMouseMove,
      },
      { event: "mousedown", function: onPointerDown },
      { event: "mouseup", function: onPointerUp },
      { event: "keyup", function: onKeyUp },
      { event: "keydown", function: onKeyDown },
      { event: "wheel", function: onMouseWheel },
    ],
  };
};
