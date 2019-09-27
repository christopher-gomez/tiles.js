import React from 'react';
import TM from './lib/tm.ts';
import * as dat from 'dat.gui';

export default class Sandbox extends React.Component {
  params = {
    cameraControl: {
      enabled: true,
      maxDistance: 150,
      minDistance: 25,
      enableZoom: true,
      zoomSpeed: 3,
      hotEdges: true,
      autoRotate: false
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
        hotEdges: this.params.cameraControl.hotEdges,
        autoRotate: this.params.cameraControl.autoRotate,
      }
    });
    this.mouse = new TM.MouseCaster(this.scene.container, this.scene.camera);

    // this constructs the cells in grid coordinate space
    this.gridSpace = new TM.Grid({
      cellSize: 5,
      gridSize: 75
    });
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
        console.log(tile.position);
        // or we can use the mouse's raw coordinates to access the cell directly, just for fun:
        //const cell = this.board.grid.pixelToCell(this.mouse.position);
        //const t = this.board.getTileAtCell(cell);
        //if (t) t.toggle();
      }
    }, this);

    const gui = new dat.GUI({ autoPlace: false });
    document.getElementById('gui').append(gui.domElement);
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
    orbitControls.add(this.params.cameraControl, 'autoRotate').name('Auto Rotate').onChange((val) => {
      console.log(val);
      this.scene.updateControls({ autoRotate: val });
    });
    const worldGUI = gui.addFolder('World');
    worldGUI.addFolder('Grid/Board');
    worldGUI.addFolder('Terrain');

    this.update();
  }
  update() {
    this.mouse.update();
    this.scene.render();
    this.animID = requestAnimationFrame(() => {
      this.update();
    });
  }
  componentWillUnmount() {
    window.cancelAnimationFrame(this.animID);
    this.scene.dispose();
    this.gridSpace.dispose();
    delete this.board;
    delete this.gridSpace;
    delete this.scene;
  }
  render() {
    return (
      <div className="App">
        <div id='gui'></div>
        <div id='view'></div>
      </div>
    );
  }
}