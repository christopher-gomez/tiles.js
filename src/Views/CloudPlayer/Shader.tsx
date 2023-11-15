import React, { useEffect, useRef } from "react";
import ThreeCanvas from "../../Components/UI/ThreeCanvas";
import * as THREE from "three";
import AnimationManager from "../../lib/utils/AnimationManager";
import { SpotifyAudioAnalysisResponse } from "../../Spotify";
import { ISpotifyPlayer } from "../../Spotify/PlayerComponent";
import Animation from "../../lib/utils/Animation";
import Tools from "../../lib/utils/Tools";

type UpdateFunction = (dt: number) => void;
type OnLoadFunction = (
  scene: THREE.Scene | Array<THREE.Scene>,
  camera: THREE.Camera,
  renderer: THREE.Renderer,
  animationManager: AnimationManager
) => void;

const vertShader = `
varying vec2 vUv;

			void main()	{

				vUv = uv;

				gl_Position = vec4( position, 1.0 );

			}
`;

const fragShader = `
varying vec2 vUv;

			uniform float time;
            uniform float beatConfidence; // Confidence of the current beat
            uniform float beatDuration;   // Duration of the current beat
            
			void main()	{

				vec2 p = - 1.0 + 2.0 * vUv;

                float a = time * 40.0 * beatDuration; // Modifying animation speed using beatDuration

				float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;

				e = 400.0 * ( p.x * 0.5 + 0.5 );
				f = 400.0 * ( p.y * 0.5 + 0.5 );
                i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;

				d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;
				r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
				q = f / r;
				e = ( r * cos( q ) ) - a / 2.0;
				f = ( r * sin( q ) ) - a / 2.0;
				d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
				h = ( ( f + d ) + a / 2.0 ) * g;
				i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );
				h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
				h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;
				i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );
				i = mod( i / 5.6, 256.0 ) / 64.0;
				if ( i < 0.0 ) i += 4.0;
				if ( i >= 2.0 ) i = 4.0 - i;
				d = r / 350.0;
                d += sin( d * d * 8.0 ) * 0.52;
				f = ( sin( a * g ) + 1.0 ) / 2.0;
				gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );


			}
`;

function getTop3Pitches(pitches) {
  return pitches
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((p) => p.index / 11.0); // Normalize the index to [0, 1] range. If you want the pitch strength, just return p.value.
}

export default ({
  onLoad,
  unLoad,
  fps = true,
  onUpdate,
  currentAnalysis,
  player,
}: {
  onLoad?: (
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  onBeat?: (
    dt: number,
    camera: THREE.Camera,
    isMoving: any,
    onPropUpdate: (
      prop: string,
      state: {
        current: {
          start: number;
          duration: number;
          confidence: number;
        };
        index: number;
        object: any;
      }
    ) => void
  ) => Promise<void>;
  onUpdate?: (
    dt: number,
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  unLoad?: boolean;
  fps?: boolean;
  currentAnalysis?: SpotifyAudioAnalysisResponse;
  player: ISpotifyPlayer;
}) => {
  const [scene, setScene] = React.useState<THREE.Scene | Array<THREE.Scene>>(
    null
  );
  const [camera, setCamera] = React.useState<THREE.Camera>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [updateRef, setUpdateRef] = React.useState<
    UpdateFunction | Array<UpdateFunction>
  >(null);
  const [onLoadedRef, setOnLoadedRef] = React.useState<
    OnLoadFunction | Array<OnLoadFunction>
  >(null);

  const [mesh, setMesh] =
    React.useState<THREE.Mesh<THREE.Geometry, THREE.ShaderMaterial>>(null);
  const meshRef = useRef(mesh);

  useEffect(() => {
    if (mesh) meshRef.current = mesh;
  }, [mesh]);

  React.useEffect(() => {
    const load = async () => {
      if (containerRef.current && !scene && !camera && onLoad) {
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const scene = new THREE.Scene();

        const geometry = new THREE.PlaneGeometry(2, 2);

        const uniforms = {
          time: { value: 1.0 },
          beatConfidence: { value: 0.0 },
          beatDuration: { value: 0.0 },
        };

        const material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertShader,
          fragmentShader: fragShader,
        });

        const mesh = new THREE.Mesh(geometry, material);
        setMesh(mesh);
        scene.add(mesh);

        setCamera(camera);
        setScene(scene);
        setOnLoadedRef(onLoad);
      }
    };

    load();
  }, [containerRef, onLoad]);

  const [shouldNotRender, setShouldNotRender] = React.useState(false);

  React.useEffect(() => {
    if (unLoad === undefined) return;

    setTimeout(
      () => {
        setShouldNotRender(unLoad);
      },
      unLoad ? 1100 : 0
    );
  }, [unLoad]);

  const findCurrentPropertyFromTime = (
    prop: "bars" | "beats" | "sections" | "segments" | "tatums",
    currentTimeS
  ) => {
    if (!currentAnalysis) return null;

    let propIndex = 0;
    const currentProp = currentAnalysis[prop].find((prop, index) => {
      const propEndTime = prop.start + prop.duration;
      propIndex = index;
      return prop.start <= currentTimeS && propEndTime > currentTimeS;
    });

    return {
      current: currentProp,
      index: propIndex,
      object: currentAnalysis[prop],
    };
  };

  const processedSegments = useRef<Array<number>>([]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: unLoad ? 0 : 1,
        transition: "all 1s",
        pointerEvents: !unLoad ? "inherit" : "none",
      }}
      ref={containerRef}
    >
      {!shouldNotRender &&
        scene !== null &&
        camera !== null &&
        onLoadedRef !== null && (
          <ThreeCanvas
            fps={fps}
            scene={scene}
            camera={camera}
            onAnimate={async (
              dt,
              scene,
              camera,
              renderer,
              animationManager
            ) => {
              if (updateRef && Array.isArray(updateRef)) {
                (updateRef as Array<UpdateFunction>).forEach((update) =>
                  update(dt)
                );
              } else if (updateRef) {
                (updateRef as UpdateFunction)(dt);
              }

              if (onUpdate)
                onUpdate(dt, scene, camera, renderer, animationManager);

              if (meshRef.current) {
                meshRef.current.material.uniforms["time"].value += dt;
              }

              if (currentAnalysis && player) {
                const state = await player.getCurrentState();

                const currentTimeS = state.position / 1000;

                const { current, index } = findCurrentPropertyFromTime(
                  "beats",
                  currentTimeS
                );

                if (
                  current &&
                  processedSegments.current.indexOf(index) === -1
                ) {
                  console.log(current);
                  processedSegments.current.push(index);
                  if (meshRef.current) {
                    const targetConfidence = current.confidence * 10;
                    const targetDuration = current.duration * 10;
                    const factor = 0.05; // Adjust this for faster/slower transitions
                    meshRef.current.material.uniforms["beatConfidence"].value =
                      Tools.lerpFactor(
                        meshRef.current.material.uniforms["beatConfidence"]
                          .value,
                        targetConfidence,
                        factor
                      );
                    meshRef.current.material.uniforms["beatDuration"].value =
                      Tools.lerpFactor(
                        meshRef.current.material.uniforms["beatDuration"].value,
                        targetDuration,
                        factor
                      );
                  }
                }
              }
            }}
            onLoaded={(scene, camera, renderer, am) => {
              if (onLoadedRef && Array.isArray(onLoadedRef)) {
                (onLoadedRef as Array<OnLoadFunction>).forEach((onLoad) =>
                  onLoad(scene, camera, renderer, am)
                );
              } else if (onLoadedRef) {
                (onLoadedRef as OnLoadFunction)(scene, camera, renderer, am);
              }

              if (onLoad !== undefined) onLoad(scene, camera, renderer, am);
            }}
            transparent={true}
            render={true}
          />
        )}
    </div>
  );
};
