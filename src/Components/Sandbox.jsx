/* eslint-disable */
import React from 'react';
import Engine from '../lib/Engine.ts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import GUI from './dat';
import './styles/sandbox.css';

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

    // this constructs the cells in grid coordinate space
    this.gridSpace = new Engine.Grid({
      gridShape: Engine.RCT,
      gridSize: 80,
      cellSize: 20,
    });
    this.map = new Engine.Map(this.gridSpace);

    this.scene = new Engine.View(this.map, {
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

    //this.map.generateOverlay(45);
    this.scene.focusOn(this.map.group);

    const el = document.getElementById('fps');
    const onAnimation = (dtS) => {
      const fps = 1 / dtS;
      el.innerHTML = 'FPS: ' + fps.toFixed(0);
    }
    this.animationID = this.scene.animationManager.addOnAnimate(onAnimation.bind(this));

    this.gui = new GUI(cc, this.scene);
  }

  componentWillUnmount() {
    this.scene.dispose();
    this.gridSpace.dispose();
    this.map.dispose();
    this.map= null;
    this.gridSpace = null;
    this.scene = null;
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
        <div id="gui">
        </div>
        <div id='fps'>
        </div>
        <button className='fullScreenToggle' onClick={() => this.toggleFullscreen()}>{toggle}</button>
      </div>
    );
  }
}
