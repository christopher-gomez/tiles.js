/* eslint-disable */
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import * as THREE from "three";
import {
  Camera,
  Scene,
} from "three";
import ThreeCard from "../../Components/UI/ThreeCard";
import Sky from "../../Components/Catan/Environment/Sky";

export default ({
    objs,
  }: {
    objs: Array<{
      obj: THREE.Object3D;
      title: string;
      onAnimate: (dt: number, camera: Camera, isMoving: boolean) => void;
    }>;
  }) => {
    useEffect(() => {
      console.log("mount");
    }, []);
  
    useEffect(() => {
      console.log("on objs");
  
      const scenes: Array<{
        scene: Scene;
        camera: Camera;
        obj: {
          obj: THREE.Object3D;
          title: string;
          onAnimate: (dt: number, camera: Camera, isMoving: boolean) => void;
        };
      }> = [];
  
      objs.forEach((o) => {
        const { scene, camera } = Sky();
        scenes.push({ scene, camera, obj: o });
      });
  
      setScenes(scenes);
    }, [objs]);
  
    const [scenes, setScenes] = useState<
      Array<{
        scene: Scene;
        camera: Camera;
        obj: {
          obj: THREE.Object3D;
          title: string;
          onAnimate: (dt: number, camera: Camera, isMoving: boolean) => void;
        };
      }>
    >(null);
  
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          transition: "all 1s",
          opacity: 1,
          display: "flex",
          flexFlow: "row",
          alignItems: "center",
          justifyContent: "center",
          ">*": { margin: "-1em" },
          zIndex: 1000,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {scenes &&
          scenes.map((s) => (
            <ThreeCard
              scene={s.scene}
              camera={s.camera}
              backgroundShadow="light"
              borderColor="light"
              mediaWindowStyle="cover"
              clearColor={0x000000}
              open={true}
              onLoaded={async (scene, camera, renderer) => {
                // const r = renderer as WebGLRenderer;
                // r.toneMapping = ACESFilmicToneMapping;
                // r.toneMappingExposure = 1;
                // THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
  
                //   'vec3 CustomToneMapping( vec3 color ) { return color; }',
  
                //   `#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
  
                //   float toneMappingWhitePoint = 1.0;
  
                //   vec3 CustomToneMapping( vec3 color ) {
                //     color *= toneMappingExposure;
                //     return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
  
                //   }`
  
                // );
                // const _s = scene as Scene;
                // const text = await new RGBELoader().loadAsync(sunset) as THREE.Texture;
                // text.mapping = THREE.EquirectangularReflectionMapping;
                // _s.background = text;
                // _s.environment = text;
                (scene as Scene).add(s.obj.obj);
                s.obj.obj.position.setY(-3);
                // s.obj.obj.position.setX(-5)
                s.obj.obj.position.setZ(-13);
                camera.lookAt(s.obj.obj.position);
                s.obj.obj.position.setY(-5);
                // (camera as PerspectiveCamera).fov = 50;
                // s.obj.obj.lookAt(camera.position)
                // camera.lookAt((scene as Scene).children[1].position);
                // ((scene as Scene).children[1] as AmbientLight).intensity = 0;
                // (scene as Scene).children[0].position.setY(-1);
                // (scene as Scene).children[0].position.setZ(-5);
                // (
                //   (scene as Scene).children[0] as Mesh<
                //     Geometry,
                //     MeshPhongMaterial
                //   >
                // ).material.emissive = new Color("red");
                // (
                //   (scene as Scene).children[0] as Mesh<
                //     Geometry,
                //     MeshPhongMaterial
                //   >
                // ).material.emissiveIntensity = 2;
              }}
              cameraSettings={{ fov: 60 }}
              onAnimate={(dt, scene, camera, renderer, am) => {
                // console.log("animating " + o.title + " scene");
  
                // console.log(scene);
                // console.log(camera);
                // console.log(o.onAnimate);
                s.obj.onAnimate(dt, camera, false);
              }}
            />
          ))}
      </Box>
    );
  };