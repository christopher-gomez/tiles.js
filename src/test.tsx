import React from 'react';
import SceneContainer from './Components/SceneContainer';
import View from './lib/scene/View';
import { addWater } from './Components/Catan/CatanHelpers';
import { BoxGeometry, MathUtils, Mesh, MeshPhongMaterial, MeshStandardMaterial, PMREMGenerator, PerspectiveCamera, PlaneBufferGeometry, PlaneGeometry, RepeatWrapping, Scene, ShaderMaterial, SphereGeometry, TextureLoader, Vector3, WebGLRenderer } from 'three';
import Engine from './lib/Engine';
import Map from './lib/map/Map';
import Grid from './lib/grid/Grid';
import HexGrid from './lib/grid/HexGrid';
import { GridSettingsParams } from './lib/utils/Interfaces';
import { Water } from 'three/examples/jsm/objects/Water';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Hills from './Components/Catan/Environment/Hills';
import HexTile from './lib/map/HexTile';

const Test = ({ scene }: { scene?: View }) => {

    // // const cRef = React.useRef<HTMLCanvasElement>();
    // React.useEffect(() => {
    //     // if (cRef.current)
    //         Hills(scene.map.tiles.filter(t => t.type.name === 'Plain').map(x => x.mesh), HexTile.baseTileShapePath.getPoints(), scene);

    //     return () => {
    //         // renderer.dispose();
    //     }
    // }, []);

    return (<>
        {/* <canvas id='test-canvas' ref={cRef} style={{ height: '100%', width: '100&' }}></canvas> */}
    </>)
}

export default () => {
    return (
        <div className="App">
            <SceneContainer sceneName="Test" fps>
                <Test />
            </SceneContainer>
        </div>
    );

}