/* eslint-disable */
import React from 'react';
import TM from '../lib/tm.ts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import './dat.css';
import GUI from './dat';

export default class Sandbox extends React.Component {
  params = {
    cameraControl: {
      controlled: true,
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 250,
      maxDistance: 400,
      zoomSpeed: 3,
      hotEdges: true,
      autoRotate: false,
      screenSpacePanning: false,
      minPolarAngle: Math.PI / 10, // Math.PI / 10
      maxPolarAngle: Math.PI / 4,
      minAzimuthAngle: 0,
      maxAzimuthAngle: -Math.PI,
      horizontalRotation: false
    }
  };
  state = {
    fullscreen: false
  }

  componentDidMount() {
    const cc = this.params.cameraControl;
    this.scene = new TM.View({
      element: document.querySelector('.App'),
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
      cellSize: 20,
      gridSize: 80
    });
    this.board = new TM.Board(this.gridSpace);

    // this will generate extruded hexagonal tiles
    this.board.generateTilemap({
      tileScale: 0.965 // you might have to scale the tile so the extruded geometry fits the cell size perfectly
    });
    this.board.generateTerrain();
    //this.board.generateOverlay(45);
    this.scene.addBoard(this.board);
    this.scene.focusOn(this.board.group);

    this.gui = new GUI(cc, this.scene);
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

  toggleFullscreen() {
    const elem = document.querySelector('.App');

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => {
        this.setState({ fullscreen: true });
      }).catch(err => {
        alert(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen().then(() => {
        this.setState({ fullscreen: false });
      });
    }
  }

  render() {
    let toggle;
    if (!document.fullscreenElement) {
      toggle = <FontAwesomeIcon icon={faExpand} size="4x" />;
    } else {
      toggle = <FontAwesomeIcon icon={faCompress} size="4x" />;
    }
    return (
      <div className="App">
        <div id="gui"></div>
        <button className='fullScreenToggle' onClick={() => this.toggleFullscreen()}>{toggle}</button>
      </div>
    );
  }
}
