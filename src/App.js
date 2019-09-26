import React from 'react';
import './App.css';
import TM from './lib/tm.ts';
import * as dat from 'dat.gui';
import { Vector3 } from 'three';

class App extends React.Component {
  params = {
    cameraControl: {
      enabled: true,
      maxDistance: 150,
      minDistance: 25,
      enableZoom: true,
      zoomSpeed: 3,
      hotEdges: true,
    }
  }
  componentDidMount() {
    
    this.scene = new TM.Scene({
      element: document.getElementById('view'),
      cameraPosition: { x: 0, y: 40, z: 50 },
      cameraControlSettings: {
        controlled: this.params.cameraControl.enabled,
        maxDistance: this.params.cameraControl.maxDistance,
        minDistance: this.params.cameraControl.minDistance,
        enableZoom: this.params.cameraControl.enableZoom,
        zoomSpeed: this.params.cameraControl.zoomSpeed,
        hotEdges: this.params.cameraControl.hotEdges
      }
    });

    // this constructs the cells in grid coordinate space
    this.gridSpace = new TM.HexGrid({
      cellSize: 5 // size of individual cells
    });

    this.gridSpace.generate({
      size: 75 // size of the board
    });

    this.mouse = new TM.MouseCaster(this.scene.container, this.scene.camera);
    this.board = new TM.Board(this.gridSpace);

    // this will generate extruded hexagonal tiles
    this.board.generateTilemap({
      tileScale: .965 // you might have to scale the tile so the extruded geometry fits the cell size perfectly
    });
    this.board.generateTerrain();
    //this.board.generateOverlay(45);
    this.board.group.rotation.y = (Math.PI / 2);
    this.scene.add(this.board.group);
    this.scene.focusOn(this.board.group);

    this.mouse.signal.add(function (evt, tile) {
      if (evt === TM.MouseCaster.CLICK) {
        //tile.toggle();
        // or we can use the mouse's raw coordinates to access the cell directly, just for fun:
        //const cell = this.board.grid.pixelToCell(this.mouse.position);
        //const t = this.board.getTileAtCell(cell);
        //if (t) t.toggle();
      }
    }, this);

    const gui = new dat.GUI();
    const camGUI = gui.addFolder('Camera');
    camGUI.add(this.scene.camera.position, 'x').step(10).listen();
    camGUI.add(this.scene.camera.position, 'y').step(10).listen();
    camGUI.add(this.scene.camera.position, 'z').step(10).listen();
    const orbitControls = camGUI.addFolder('Control');
    orbitControls.add(this.params.cameraControl, 'enabled').name('Enabled').onChange(() => {
      this.scene.toggleControls();
    });
    orbitControls.add(this.params.cameraControl, 'maxDistance', 0, 1000).step(10).name('Max Zoom Out').onChange((val) => {
      this.scene.updateControls({ maxDistance: val });
    });
    orbitControls.add(this.params.cameraControl, 'minDistance', 0, 1000).step(10).name('Max Zoom In').onChange((val) => {
      this.scene.updateControls({ minDistance: val });
    });
    orbitControls.add(this.params.cameraControl, 'zoomSpeed', 0, 20).step(1).name('Zoom Speed').onChange((val) => {
      this.scene.updateControls({ zoomSpeed: val });
    });
    orbitControls.add(this.params.cameraControl, 'hotEdges').name('Edge Scroll').onChange((val) => {
      this.scene.updateControls({ hotEdges: val });
    });
    const worldGUI = gui.addFolder('World');
    worldGUI.addFolder('Grid/Board');
    worldGUI.addFolder('Terrain');

    this.update();
  }
  update() {
    this.mouse.update();
    this.scene.render();
    requestAnimationFrame(() => {
      this.update();
    });
  }
  render() {
    return (
      <div className="App">
        <div id='view'></div>
      </div>
    );
  }
}

export default App;
