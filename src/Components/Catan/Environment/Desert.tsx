import { Euler, Group, InstancedMesh, LinearMipMapLinearFilter, LinearMipmapLinearFilter, Material, Matrix4, RepeatWrapping, TextureLoader, Vector2, } from "three";
import View from "../../../lib/scene/View";
import { createFarmland, generateCactusSystem } from ".";
import Tile from "../../../lib/map/Tile";
import sandyGroundTexture from '../../../Assets/Textures/HITW-TS2-sandy-ground.jpg';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

//@ts-ignore
import pierModel from '../../../Assets/Models/Pier/MoloLH.fbx';
//@ts-ignore
import lightHouseModel from '../../../Assets/Models/lightHouse.fbx';

export default async (containers: Tile[], boundary: Vector2[], view: View) => {
    containers[0].geometry.computeBoundingBox();
    let measure = containers[0].geometry.boundingBox;

    var width = (measure.max.x - measure.min.x);
    var height = (measure.max.y - measure.min.y);
    // width *= .8;
    // height *= .85;
    // console.log('width: '+ width);
    // console.log('height: '+height);

    var resolution = 8;
    var loader = new TextureLoader();

    const t = await loader.loadAsync(sandyGroundTexture);

    t.wrapS = t.wrapT = RepeatWrapping;
    t.minFilter = LinearMipMapLinearFilter;
    t.anisotropy = view.renderer.capabilities.getMaxAnisotropy();
    const { ground, noise } = createFarmland(width, height, resolution, boundary, containers[0], t);
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

    groundInstances.rotation.copy(baseRotation);
    // groundInstances.frustumCulled = false;
    view.container.add(groundInstances);

    boundary = boundary.map(x => x.clone().multiplyScalar(.85))
    for (const tile of containers) {
        let cactus = await generateCactusSystem(width, height, boundary, tile);
        tile.mesh.add(cactus);
    }
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