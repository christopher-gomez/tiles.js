/* eslint-disable */
import React from 'react';
import TM from '../lib/tm.ts';
import { Link } from "react-router-dom";

export default class Splash extends React.Component {
  params = {
    cameraControl: {
      enableDamping: true,
      controlled: false,
      dampingFactor: 0.05,
      minDistance: 250,
      maxDistance: 400,
      zoomSpeed: 3,
      autoRotate: true,
      screenSpacePanning: false,
      minPolarAngle: Math.PI / 10, // Math.PI / 10
      maxPolarAngle: Math.PI / 4,
      minAzimuthAngle: 0,
      maxAzimuthAngle: -Math.PI,
      horizontalRotation: true
    }
  }
  componentDidMount() {
    const cc = this.params.cameraControl;
    this.scene = new TM.View({
      element: document.getElementById('engine'),
      cameraPosition: { x: 0, y: 40, z: 50 },
      cameraControlSettings: {
        controlled: cc.controlled,
        enableDamping: cc.enableDamping,
        dampingFactor: cc.dampingFactor,
        maxDistance: cc.maxDistance,
        minDistance: cc.minDistance,
        enableZoom: cc.enableZoom,
        zoomSpeed: cc.zoomSpeed,
        hotEdges: cc.hotEdges,
        autoRotate: cc.autoRotate,
        screenSpacePanning: cc.screenSpacePanning,
        minPolarAngle: cc.minPolarAngle,
        maxPolarAngle: cc.maxPolarAngle,
        maxAzimuthAngle: cc.maxAzimuthAngle,
        minAzimuthAngle: cc.minAzimuthAngle,
        horizontalRotation: cc.horizontalRotation
      }
    });
    // this constructs the cells in grid coordinate space
    this.gridSpace = new TM.Grid({
      cellSize: 15,
      gridSize: 100
    });
    this.board = new TM.Board(this.gridSpace);

    // this will generate extruded hexagonal tiles
    this.board.generateTilemap({
      tileScale: .965 // you might have to scale the tile so the extruded geometry fits the cell size perfectly
    });
    this.board.generateTerrain();
    //this.board.generateOverlay(45);
    this.scene.addBoard(this.board);
    this.scene.focusOn(this.board.group);
  }
  componentWillUnmount() {
    window.cancelAnimationFrame(this.animID);
    this.scene.dispose();
    this.gridSpace.dispose();
    this.board.dispose();
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
          <h3>A 3D Tile Engine</h3>
          <Link to='/sandbox' style={{ backgroundColor: 'rgb(147,217,69)', color:'black'}}>Sandbox</Link>
          <br/>
          <Link to='/docs'>Docs</Link>
          <br />
          <a href='https://github.com/christophgomez/threejs-tilemap' target="_blank" rel="noopener noreferrer">Github</a>
        </div>
        <div id='engine'></div>
      </div>
    );
  }
}