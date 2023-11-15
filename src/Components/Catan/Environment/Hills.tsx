import { Box3, BoxBufferGeometry, BoxGeometry, BoxHelper, BufferAttribute, BufferGeometry, Color, DoubleSide, Euler, Float32BufferAttribute, Frustum, InstancedBufferAttribute, InstancedBufferGeometry, InstancedMesh, LinearMipMapLinearFilter, LinearMipmapLinearFilter, Material, Matrix4, Mesh, MeshNormalMaterial, MeshPhongMaterial, Object3D, PlaneBufferGeometry, PlaneGeometry, Quaternion, RawShaderMaterial, RepeatWrapping, Scene, ShaderMaterial, TextureLoader, Vector2, Vector3, } from "three";
import View from "../../../lib/scene/View";
import { generateGrassSystem, createHills } from ".";
import grassTAsset from '../../../Assets/Textures/top-view-artificial-grass-soccer-field-background-texture.jpg';
import Tile from "../../../lib/map/Tile";
import Tools from "../../../lib/utils/Tools";

export default async (containers: Tile[], boundary: Vector2[], view: View) => {

    containers[0].geometry.computeBoundingBox();
    let measure = containers[0].geometry.boundingBox;

    //Patch side length
    var width = (measure.max.x - measure.min.x);
    var height = (measure.max.y - measure.min.y);

    //Number of vertices on ground plane side
    var resolution = 32;
    var loader = new TextureLoader();

    const t = await loader.loadAsync(grassTAsset);

    t.wrapS = t.wrapT = RepeatWrapping;
    t.minFilter = LinearMipMapLinearFilter;
    t.anisotropy = view.renderer.capabilities.getMaxAnisotropy();
    const { ground, noise } = createHills(width, height, resolution, boundary, containers[0], t);
    // Calculate the base rotation
    const baseRotation = new Euler(0, -Math.PI / 2, 0);
    // Create the instanced mesh
    const instanceCount = containers.length;



    const groundInstances = new InstancedMesh(ground.geometry.clone(), ground.material, instanceCount);

    // Populate the instance positions
    for (let i = 0; i < instanceCount; i++) {
        const x = containers[i].mesh.position.x;
        const y = 0;
        const z = containers[i].mesh.position.z;
        groundInstances.setMatrixAt(i, new Matrix4().setPosition(x, y, z));
    }

    groundInstances.instanceMatrix.needsUpdate = true;

    groundInstances.rotation.copy(baseRotation);
    // groundInstances.frustumCulled = false;

    // scene.add(groundInstances);
    view.container.add(groundInstances);
    const yAxis = new Vector3(0, 1, 0); // Assuming your y-axis is the axis around which you want to rotate
    const yRot = -90 * Math.PI / 180; // Assuming your rotation angle in radians
    // Assuming _yRot is the rotation angle of the tile in radians
    const rotationMatrix = new Matrix4().makeRotationAxis(yAxis, yRot);


    let closestDistance = Number.POSITIVE_INFINITY; // Set to a very large value initially
    let curClosest = -1;
    const grasses = [];

    // Populate the instance positions
    for (let i = 0; i < instanceCount; i++) {
        const grass = generateGrassSystem(width, height, boundary, containers[i], view.camera, view.controller, ground.geometry, containers[i].geometry.boundingBox.max.z + .1, 12);
        grass.frustumCulled = false;
        containers[i].mesh.add(grass);
        grasses.push(grass);
    }

    var time = 0;
    var lastFrame = Date.now();
    var thisFrame;
    var dT;

    view.animationManager.addOnAnimateListener((dT) => {
        thisFrame = Date.now();
        // dT = (thisFrame - lastFrame) / 200.0;
        dT *= 3.5;
        time += dT;
        lastFrame = thisFrame;

        let cameraPositionInTileSpace = view.camera.position.clone();

        // Apply the rotation transformation to the camera position
        cameraPositionInTileSpace = cameraPositionInTileSpace.applyMatrix4(rotationMatrix.clone().invert());


        // Update frustum with the camera's projection matrix and view matrix

        for (let i = 0; i < grasses.length; i++) {
            const grass = grasses[i];
            grass.material.uniforms.time.value = time;
            grass.material.uniforms.cameraPosition = { value: cameraPositionInTileSpace };
            // const tilePositionInCameraSpace = containers[i].mesh.position.clone().applyMatrix4(rotationMatrix);

            // // The distance calculation in the tile's coordinate space
            // const dx = view.camera.position.x - tilePositionInCameraSpace.x;
            // const dy = view.camera.position.y - tilePositionInCameraSpace.y;
            // const dz = view.camera.position.z - tilePositionInCameraSpace.z;

            // // Calculate the squared distance
            // let distanceSquared = dx * dx + dy * dy + dz * dz;

            // // Apply the exponential scaling factor (adjust the exponent value as needed)
            // let scaleFactor = 1.0; // You can adjust this value to control the exaggeration
            // let scaledDistanceInTileSpace = Math.pow(distanceSquared, scaleFactor);

            // // Take the square root to get the final distance
            // let distanceInTileSpace = Math.sqrt(scaledDistanceInTileSpace);

            // // Update the closestDistance if the current instance is closer
            // if (distanceInTileSpace < closestDistance) {
            //     closestDistance = distanceInTileSpace;
            //     curClosest = i;
            // }
        }

        // for (let i = 0; i < grasses.length; i++) {
        //     const grass = grasses[i];
        //     const tilePositionInCameraSpace = containers[i].mesh.position.clone().applyMatrix4(rotationMatrix);

        //     // The distance calculation in the tile's coordinate space
        //     const dx = view.camera.position.x - tilePositionInCameraSpace.x;
        //     const dy = view.camera.position.y - tilePositionInCameraSpace.y;
        //     const dz = view.camera.position.z - tilePositionInCameraSpace.z;

        //     // Calculate the squared distance
        //     let distanceSquared = dx * dx + dy * dy + dz * dz;

        //     // Apply the exponential scaling factor (adjust the exponent value as needed)
        //     let scaleFactor = i === curClosest ? 1 : 1.125; // You can adjust this value to control the exaggeration
        //     let scaledDistanceInTileSpace = Math.pow(distanceSquared, scaleFactor);

        //     // Take the square root to get the final distance
        //     let distanceInTileSpace = Math.sqrt(scaledDistanceInTileSpace);

        //     if (i === curClosest && view.currentDistance < view.controller.config.maxDistance) {
        //         grass.frustumCulled = false;
        //     } else if (view.currentDistance === view.controller.config.maxDistance) {
        //         grass.frustumCulled = true;
        //     }
        //     else {
        //         // If the entire tile is not in view, frustum cull the grass instances
        //         grass.frustumCulled = !Tools.isMeshInView(containers[i].mesh, view.camera);
        //     }

        //     // Set the closest instance's distance to 0
        //     grass.material.uniforms.currentDistance = { value: 0 };
        //     grass.material.uniforms.cameraPosition = { value: cameraPositionInTileSpace };
        //     // const alpha = 1.0 - Math.min(distanceInTileSpace / view.controller.config.maxDistance, 1.0);
        //     // grass.material.opacity = alpha;
        // }

    });

}

// window.addEventListener('resize', onWindowResize, false);
// function onWindowResize(){
//   let w = canvas.clientWidth;
//   let h = canvas.clientHeight;
//   if(!isInFullscreen()){
//     renderer.setPixelRatio( window.devicePixelRatio );
//     h = w/1.6;
//   }else{
//     //Reduce resolution at full screen for better performance
//     renderer.setPixelRatio( defaultPixelRatio );
//   }
//   camera.aspect = w / h;
//   renderer.setSize(w, h, false);
//   backgroundMaterial.uniforms.resolution.value = new Vector2(canvas.width, canvas.height);
//   camera.updateProjectionMatrix();
// }