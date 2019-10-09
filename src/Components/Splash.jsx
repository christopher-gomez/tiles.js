/* eslint-disable */
import React from 'react';
import Engine from '../lib/Engine.ts';
import { Link } from "react-router-dom";

export default class Splash extends React.Component {
  params = {
    cameraControl: {
      enableDamping: true,
      controlled: false,
      dampingFactor: 0.05,
      minDistance: 150,
      maxDistance: 200,
      zoomSpeed: 3,
      autoRotate: true,
      screenSpacePanning: false,
      minPolarAngle: 0, // Math.PI / 10
      maxPolarAngle: 60,
      minAzimuthAngle: 0,
      maxAzimuthAngle: -Math.PI,
      horizontalRotation: true
    }
  }
  componentDidMount() {
    const cc = this.params.cameraControl;
    // this constructs the cells in grid coordinate space
    this.gridSpace = new Engine.Grid({
      gridShape: Engine.HEX,
      cellSize: 15,
      gridSize: 80
    });
    this.map = new Engine.Map(this.gridSpace);
    this.scene = new Engine.View(this.map, {
      element: document.getElementById('engine'),
      cameraPosition: { x: 50, y: 52, z: 50 },
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
    //this.board.generateOverlay(45);

    this.scene.focusOn(this.map.getRandomTile());
  }
  componentWillUnmount() {
    window.cancelAnimationFrame(this.animID);
    this.scene.dispose();
    this.gridSpace.dispose();
    this.map.dispose();
    delete this.map;
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