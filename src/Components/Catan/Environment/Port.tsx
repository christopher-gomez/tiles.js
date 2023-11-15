import { Box3, BufferGeometry, Group, Matrix4, Mesh, Quaternion, TextureLoader, Vector2, Vector3, } from "three";
import View from "../../../lib/scene/View";
import Tile from "../../../lib/map/Tile";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

//@ts-ignore
import pierModel from '../../../Assets/Models/Pier/MoloLH.fbx';
//@ts-ignore
import lightHouseModel from '../../../Assets/Models/lightHouse.fbx';
import Tools from "../../../lib/utils/Tools";
import MeshEntity from "../../../lib/env/MeshEntity";
import GroupEntity from "../../../lib/env/GroupEntity";
import { Resources } from "../CatanHelpers";
import { LineDashedMaterial, Line } from 'three';

const worldPosition = new Vector3();
const screenPosition = new Vector3();
const fbxLoader = new FBXLoader();

export const createLightHouse = async () => {
    const baseLightHouse = await fbxLoader.loadAsync(lightHouseModel) as Group;

    const lightHouseClone = baseLightHouse.clone(true);

    return new GroupEntity('Port Lighthouse', lightHouseClone);
}

export default async (containers: Tile[], scene: View, toggleBubble: React.Dispatch<React.SetStateAction<{
    toggled: boolean;
    position: {
        x: number;
        y: number;
    };
    resourceType: Resources;
    amountNeeded: number;
}>>) => {

    const baseLightHouse = await fbxLoader.loadAsync(lightHouseModel) as Group;

    const rotMat = new Matrix4();
    const targetQuat = new Quaternion();
    let i = 1;
    for (const tile of containers) {
        // get the position of the hex vertex that is a port
        const data = tile.getCustomData().ports;

        // there are two ports on each tile, the are each next to each other
        const ports = Object.keys(data).map(vert => parseInt(vert));

        // Sort the array of ports in ascending order
        ports.sort((a, b) => a - b);

        if (!Tools.areSequentialNumbers(ports) && !(ports[0] === 0 && ports[ports.length - 1] === 5)) {
            continue;
        }
        const port1Pos = tile.getVertexLocalPosition(ports[0]);
        const port2Pos = tile.getVertexLocalPosition(ports[1]);

        // Calculate the midpoint between the two ports

        const targetPoint = new Vector3().addVectors(port1Pos, port2Pos).multiplyScalar(0.5);
        const midpoint = targetPoint.clone();

        // Calculate the vector from the midpoint to the origin (0,0)
        const vectorToOrigin = targetPoint.clone();

        // Define the distance to move in the opposite direction of the origin
        const distanceFromOrigin = 25; // Adjust this value as needed

        // Move the midpoint along the calculated vector
        targetPoint.add(vectorToOrigin.normalize().clone().multiplyScalar(distanceFromOrigin)).setZ(1);

        const piers: Array<MeshEntity> = [];
        for (const portVert of ports) {
            const pos = tile.getVertexLocalPosition(portVert).setZ(1);
            pos.add(pos.clone().normalize().multiplyScalar(1));

            const pier = Tools.createRectEntity(5, 2.5, 1, { baseColor: 0x63523d });
            tile.mesh.add(pier)
            pier.ignoreRay = false;

            // Set the position of the pier's end
            pier.position.copy(pos).setZ(1);

            const start = pos.clone();
            const end = targetPoint.clone();

            rotMat.lookAt(start, end, pier.up);

            targetQuat.setFromRotationMatrix(rotMat);
            pier.quaternion.set(targetQuat.x, targetQuat.y, targetQuat.z, targetQuat.w);

            let isSharedPort = false;

            // Slide the pier closer to the direction it's pointing
            const slideInDistance = isSharedPort ? -.5 : 4.25; // Adjust this value as needed
            const slideOutDistance = isSharedPort ? 2.5 : 2.5;
            const direction = new Vector3().subVectors(end, start).normalize();
            const newPosition1 = start.clone().add(direction.multiplyScalar(slideOutDistance));

            // Slide the pier towards the midpoint between the vertices
            const directionToMidpoint = new Vector3().subVectors(midpoint, start).normalize();
            const newPosition2 = start.clone().add(directionToMidpoint.multiplyScalar(slideInDistance));

            // Calculate the final new position as a combination of both movements
            const finalNewPosition = newPosition1.lerp(newPosition2, .5).clone(); // Adjust the lerp factor as needed
            pier.position.copy(finalNewPosition);

            piers.push(pier);
        }
        const lightHouseClone = baseLightHouse.clone(true);

        const lhe = new GroupEntity('Port Lighthouse ' + i, lightHouseClone);
        tile.mesh.add(lhe);

        lhe.scale.set(4, 4, 4);
        lhe.ignoreRay = false;

        const positionBubble = () => {
            lhe.getWorldPosition(worldPosition);
            worldPosition.project(scene.camera);

            // Calculate the screen position
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            screenPosition.x = (worldPosition.x + 1) * (screenWidth / 2);
            screenPosition.y = (-worldPosition.y + 1) * (screenHeight / 2);

            // add some space between the bubble and the lighthouse
            // Create a Box3 object to represent the bounding box
            const boundingBox = new Box3();

            // Calculate the bounding box of the lighthouse group
            boundingBox.setFromObject(lightHouseClone);
            const boundingBoxWidth = boundingBox.max.x - boundingBox.min.x;
            const boundingBoxHeight = boundingBox.max.z - boundingBox.min.z;

            // Check if the lighthouse is on the right side of the screen
            if (screenPosition.x >= screenWidth / 2) {
                screenPosition.x = screenPosition.x - boundingBoxWidth - 115; // Adjust the gap as needed
            } else {
                screenPosition.x = screenPosition.x + boundingBoxWidth + 20; // Adjust the gap as needed
            }

            // Check if the lighthouse is on the top side of the screen
            if (screenPosition.y >= screenHeight / 2) {
                screenPosition.y = screenPosition.y - boundingBoxHeight - 100; // Adjust the gap as needed
            } else {
                screenPosition.y = screenPosition.y + boundingBoxHeight + 20; // Adjust the gap as needed
            }

            toggleBubble({ toggled: true, position: { x: screenPosition.x, y: screenPosition.y }, resourceType: Object.values(data)[0]['type'], amountNeeded: Object.values(data)[0]['from'] })
        }
        lhe.addHighlightEvent(() => {

            lhe.highlight(true);
            piers.forEach(p => p.highlight(true));
            positionBubble();

            // lhe.highlight(true);
            // lhe.getWorldPosition(worldPosition);

            // // Calculate the screen position
            // const screenWidth = window.innerWidth;
            // const screenHeight = window.innerHeight;

            // const screenPosition = worldPosition.clone().project(scene.camera);

            // // Calculate the adjusted bubble position
            // const bubbleRadius = 200;
            // const minMargin = 50;
            // const bubblePosition = new Vector2(
            //     (screenPosition.x * 0.5 + 0.5) * screenWidth,
            //     (-screenPosition.y * 0.5 + 0.5) * screenHeight
            // );

            // // Ensure there's a gap between the UI and the lighthouse
            // const uiMargin = 800; // Adjust this value as needed

            // if (screenPosition.x >= 0) {
            //     // Place the bubble to the left of the lighthouse
            //     bubblePosition.x = bubbleRadius + minMargin + uiMargin;
            // } else {
            //     // Place the bubble to the right of the lighthouse
            //     bubblePosition.x = screenWidth - bubbleRadius - minMargin - uiMargin;
            // }

            // // Adjust the vertical position if necessary (to avoid top/bottom edges)
            // if (bubblePosition.y - bubbleRadius < minMargin) {
            //     bubblePosition.y = bubbleRadius / 2 + minMargin;
            // } else if (bubblePosition.y + bubbleRadius > screenHeight - minMargin) {
            //     bubblePosition.y = screenHeight - bubbleRadius - minMargin;
            // }

            // toggleBubble({ toggled: true, position: { x: bubblePosition.x, y: bubblePosition.y } });
        })

        lhe.addUnhighlightEvent(() => {
            lhe.highlight(false);
            piers.forEach(p => p.highlight(false));
            toggleBubble(s => ({ ...s, toggled: false, position: { x: 0, y: 0 } }))
        })


        piers.forEach(p => {
            p.addHighlightEvent(() => {
                lhe.highlight(true);
                positionBubble();
            });

            p.addUnhighlightEvent(() => {
                lhe.highlight(false);
                toggleBubble(s => ({ ...s, toggled: false, position: { x: 0, y: 0 } }))
            })
        });

        lhe.rotation.x = Math.PI / 2;
        lhe.position.copy(targetPoint.clone()).setZ(-5);
        i++;
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