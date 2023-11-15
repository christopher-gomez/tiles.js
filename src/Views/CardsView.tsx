/* eslint-disable */
import React from "react";
import {
  Mesh,
  Object3D,
  PlaneBufferGeometry,
  Scene,
  ShaderMaterial,
  Vector3,
} from "three";
import { Box } from "@mui/material";
import ThreeCard from "../Components/UI/ThreeCard";
import GroupEntity from "../lib/env/GroupEntity";
import {
  createWater,
  updateWaterMaterial,
} from "../Components/Catan/Environment/Water";
import { createLightHouse } from "../Components/Catan/Environment/Port";
import RoutesView from "../Components/UI/RoutesView";
import Cloud from "../Components/Catan/Environment/Cloud";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment";
import HoverCard from "../Components/UI/HoverCard";

export default () => {
  const [loading, setLoading] = React.useState(true);

  const waterMesh = React.useRef<Mesh>(null);
  const lighthouseWaterMesh = React.useRef<Mesh>(null);
  const lightHouse = React.useRef<GroupEntity>(null);

  const [scenes, setScenes] = React.useState<
    Array<{
      obj: Object3D;
      onOpen: (scene, camera) => void;
      onAnimate: (dt, scene, camera, renderer) => void;
      fov: number;
      title: string;
      description: string;
    }>
  >(null);

  React.useEffect(() => {
    if (!lightHouse.current) {
      const loadObjs = async () => {
        lighthouseWaterMesh.current = createWater(
          new PlaneBufferGeometry(100, 100, 8, 8)
        );

        waterMesh.current = lighthouseWaterMesh.current.clone();

        lightHouse.current = await createLightHouse();

        lighthouseWaterMesh.current.add(lightHouse.current);
        lightHouse.current.rotation.x = Math.PI / 2;
        lightHouse.current.position.setZ(-1);

        const { group, update } = Cloud();

        const scenes = [
          {
            obj: lighthouseWaterMesh.current,
            fov: 25,
            onOpen: (scene, camera) => {
              camera.position.set(0, -12, 7); // Adjust the values as needed
              camera.lookAt(lightHouse.current.position.clone().setZ(2));
            },
            onAnimate: (dt, scene, camera, renderer) => {
              updateWaterMaterial(
                lighthouseWaterMesh.current.material as ShaderMaterial,
                dt,
                {
                  x: renderer.domElement.offsetWidth,
                  y: renderer.domElement.offsetHeight,
                }
              );

              if (cardShowing) {
                // waterMesh.current.rotation.x += 0.01;
                lighthouseWaterMesh.current.rotation.z += 0.005;
                camera.lookAt(lightHouse.current.position.clone().setZ(2));
              }
            },
            title: "Lighthouse",
            description: "A coastal lighthouse to keep your harbors safe.",
          },
          {
            obj: waterMesh.current,
            fov: 40,
            onOpen: (scene, camera) => {
              camera.position.set(0, -12, 12); // Adjust the values as needed
              camera.lookAt(new Vector3(0, 0, 0).setZ(5));
            },
            onAnimate: (dt, scene, camera, renderer) => {
              updateWaterMaterial(
                waterMesh.current.material as ShaderMaterial,
                dt,
                {
                  x: renderer.domElement.offsetWidth,
                  y: renderer.domElement.offsetHeight,
                }
              );
            },
            title: "Ocean",
            description: "Big Blue.",
          },
          {
            obj: group,
            fov: 40,
            onOpen: (scene, camera) => {
              camera.position.set(0, -12, 12); // Adjust the values as needed
              camera.lookAt(new Vector3(0, 0, 0).setZ(5));
            },
            onAnimate: (dt, scene, camera, renderer) => {
              update(dt, camera);
            },
            title: "Cloud",
            description: "Big Whte.",
          },
        ];

        // setBGRoom(new RoomEnvironment());
        setScenes(scenes);
        setLoading(false);
      };

      loadObjs();
    }
  }, []);

  const [cardShowing, setCardShowing] = React.useState(true);
  const [vis, setVis] = React.useState(false);

  const [curCard, setCurCard] = React.useState(0);

  const [bgRoom, setBGRoom] = React.useState<RoomEnvironment>(null);
  const [bgLoaded, setBgLoaded] = React.useState(false);

  return (
    <div className="App">
      {/* {bgRoom && (
        <ThreeCanvas
          fps={true}
          scene={bgRoom as Scene}
          onAnimate={(dt, scene, camera, renderer) => {
            // if (updateRef && Array.isArray(updateRef)) {
            //   (updateRef as Array<UpdateFunction>).forEach((update) =>
            //     update(dt)
            //   );
            // } else if (updateRef) {
            //   (updateRef as UpdateFunction)(dt);
            // }
          }}
          onLoaded={(scene, camera, renderer, am) => {
            // if (onLoadedRef && Array.isArray(onLoadedRef)) {
            //   (onLoadedRef as Array<OnLoadFunction>).forEach((onLoad) =>
            //     onLoad(scene, camera, renderer, am)
            //   );
            // } else if (onLoadedRef) {
            //   (onLoadedRef as OnLoadFunction)(scene, camera, renderer, am);
            // }

            setBgLoaded(true);
          }}
          transparent={true}
          render={true}
        />
      )} */}
      <RoutesView
        title="Cards.js"
        defaultDescription="Explore 2D React Cards with 3D Animations"
        loading={loading /**&& !bgLoaded**/}
        onLinksSlideComplete={() => setVis(true)}
        animCompleteLinkSlideDelay={0}
      >
        {scenes && (
          <Box sx={{ transition: "all 1s", opacity: vis ? 1 : 0 }}>
            <ThreeCard
              onOpen={(scene, camera) => {
                scenes[curCard].onOpen(scene, camera);
              }}
              open={cardShowing}
              setOpen={(open) => setCardShowing(open)}
              obj={scenes[curCard].obj}
              cameraSettings={{ fov: scenes[curCard].fov }}
              onAnimate={(dt, scene, camera, renderer) => {
                scenes[curCard].onAnimate(dt, scene, camera, renderer);
              }}
              title={scenes[curCard].title}
              body={scenes[curCard].description}
            />
          </Box>
        )}
      </RoutesView>
    </div>
  );
};
