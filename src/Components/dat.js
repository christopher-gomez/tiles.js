import * as dat from 'dat.gui';

export default class GUI { 
  constructor(options, scene) {
    this.gui = new dat.GUI({ autoPlace: false });
    document.getElementById('gui').append(this.gui.domElement);
    document.getElementById('gui').addEventListener('mousedown', (e) => {
      e.stopPropagation();
    }, false);
    document.getElementById('gui').addEventListener('mouseup', (e) => {
      e.stopPropagation();
    }, false);
    const camGUI = this.gui.addFolder('Camera');
    camGUI
      .add(scene.camera.position, 'x')
      .step(10)
      .listen();
    camGUI
      .add(scene.camera.position, 'y')
      .step(10)
      .listen();
    camGUI
      .add(scene.camera.position, 'z')
      .step(10)
      .listen();
    const orbitControls = camGUI.addFolder('Control');
    orbitControls
      .add(options, 'controlled')
      .name('Enabled')
      .onChange(() => {
        scene.toggleControls();
      });
    orbitControls
      .add(options, 'enableDamping')
      .name('Damping')
      .onChange(val => {
        scene.updateControls({ enableDamping: val });
      });
    orbitControls
      .add(options, 'dampingFactor', 0, 1)
      .step(0.01)
      .name('Damping Factor')
      .onChange(val => {
        scene.updateControls({ dampingFactor: val });
      });
    orbitControls
      .add(options, 'maxDistance', 0, 1000)
      .step(10)
      .name('Max Zoom Out')
      .onChange(val => {
        scene.updateControls({ maxDistance: val });
      });
    orbitControls
      .add(options, 'minDistance', 0, 1000)
      .step(10)
      .name('Max Zoom In')
      .onChange(val => {
        scene.updateControls({ minDistance: val });
      });
    orbitControls
      .add(options, 'zoomSpeed', 0, 20)
      .step(1)
      .name('Zoom Speed')
      .onChange(val => {
        scene.updateControls({ zoomSpeed: val });
      });
    orbitControls
      .add(options, 'hotEdges')
      .name('Edge Scroll')
      .onChange(val => {
        scene.updateControls({ hotEdges: val });
      });
    orbitControls
      .add(options, 'autoRotate')
      .name('Auto Rotate')
      .onChange(val => {
        scene.updateControls({ autoRotate: val });

        if (val === true) {
          options.horizontalRotation = true;
        } else {
          options.horizontalRotation = false;
        }
      });
    orbitControls
      .add(options, 'screenSpacePanning')
      .name('Screen Space Panning')
      .onChange(val => {
        scene.updateControls({ screenSpacePanning: val });
      });
    orbitControls
      .add(options, 'minPolarAngle', 0, 180)
      .step(1)
      .name('Min Polar Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ minPolarAngle: val });
      });
    orbitControls
      .add(options, 'maxPolarAngle', 0, 180)
      .step(1)
      .name('Max Polar Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ minPolarAngle: val });
      });
    orbitControls
      .add(options, 'minAzimuthAngle', -180, 180)
      .step(1)
      .name('Min Azimuth Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ minAzimuthAngle: val });
      });
    orbitControls
      .add(options, 'maxAzimuthAngle', -180, 180)
      .step(1)
      .name('Max Azimuth Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ maxAzimuthAngle: val });
      });
    orbitControls
      .add(options, 'horizontalRotation')
      .name('Hor. Rotation')
      .onChange(val => {
        scene.toggleHorizontalRotation(val);
      })
      .listen();
    const worldGUI = this.gui.addFolder('World');
    worldGUI.addFolder('Grid/Board');
    worldGUI.addFolder('Terrain');
    camGUI.open();
    orbitControls.open();
  }
}