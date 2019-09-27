/* eslint-disable */
import React from 'react';
import TM from './lib/tm.ts';
import { Link } from "react-router-dom";

export default class Splash extends React.Component {
  params = {
    cameraControl: {
      enabled: true,
      maxDistance: 150,
      minDistance: 25,
      enableZoom: false,
      zoomSpeed: 3,
      hotEdges: false,
      autoRotate: true,
      maxAzimuthAngle: Math.PI / 6,
      minAzimuthAngle: -Math.PI / 6
    }
  }
  componentDidMount() {

    this.scene = new TM.Scene({
      element: document.getElementById('engine'),
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
    this.update();
  }
  update() {
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
        <div id='overlay'>
          <h1>Tiles.js</h1>
          <hr></hr>
          <h3>A small, 3D tilemap JavaScript Engine</h3>
          <Link to='/sandbox' style={{ backgroundColor: 'rgb(147,217,69)', color:'black'}}>Sandbox</Link>
          <br/>
          <Link to='/docs'>API</Link>
          <br />
          <a href='https://github.com/christophgomez/threejs-tilemap' target="_blank" rel="noopener noreferrer">Github</a>
        </div>
        <div id='engine'></div>
      </div>
    );
  }
}