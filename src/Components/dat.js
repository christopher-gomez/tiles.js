import * as dat from 'dat.gui';

export default class GUI { 
  constructor(cc, scene) {
    this.gui = new dat.GUI({ autoPlace: false });
    document.getElementById('gui').append(this.gui.domElement);
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
      .add(cc, 'controlled')
      .name('Enabled')
      .onChange(() => {
        scene.toggleControls();
      });
    orbitControls
      .add(cc, 'enableDamping')
      .name('Damping')
      .onChange(val => {
        scene.updateControls({ enableDamping: val });
      });
    orbitControls
      .add(cc, 'dampingFactor', 0, 1)
      .step(0.01)
      .name('Damping Factor')
      .onChange(val => {
        scene.updateControls({ dampingFactor: val });
      });
    orbitControls
      .add(cc, 'maxDistance', 0, 1000)
      .step(10)
      .name('Max Zoom Out')
      .onChange(val => {
        scene.updateControls({ maxDistance: val });
      });
    orbitControls
      .add(cc, 'minDistance', 0, 1000)
      .step(10)
      .name('Max Zoom In')
      .onChange(val => {
        scene.updateControls({ minDistance: val });
      });
    orbitControls
      .add(cc, 'zoomSpeed', 0, 20)
      .step(1)
      .name('Zoom Speed')
      .onChange(val => {
        scene.updateControls({ zoomSpeed: val });
      });
    orbitControls
      .add(cc, 'hotEdges')
      .name('Edge Scroll')
      .onChange(val => {
        scene.updateControls({ hotEdges: val });
      });
    orbitControls
      .add(cc, 'autoRotate')
      .name('Auto Rotate')
      .onChange(val => {
        scene.updateControls({ autoRotate: val });

        if (val === true) {
          cc.horizontalRotation = true;
        } else {
          cc.horizontalRotation = false;
        }
      });
    orbitControls
      .add(cc, 'screenSpacePanning')
      .name('Screen Space Panning')
      .onChange(val => {
        scene.updateControls({ screenSpacePanning: val });
      });
    orbitControls
      .add(cc, 'minPolarAngle', 0, 180)
      .step(1)
      .name('Min Polar Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ minPolarAngle: val });
      });
    orbitControls
      .add(cc, 'maxPolarAngle', 0, 180)
      .step(1)
      .name('Max Polar Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ minPolarAngle: val });
      });
    orbitControls
      .add(cc, 'minAzimuthAngle', -180, 180)
      .step(1)
      .name('Min Azimuth Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ minAzimuthAngle: val });
      });
    orbitControls
      .add(cc, 'maxAzimuthAngle', -180, 180)
      .step(1)
      .name('Max Azimuth Angle')
      .onChange(val => {
        val = (val * Math.PI) / 180;
        scene.updateControls({ maxAzimuthAngle: val });
      });
    orbitControls
      .add(cc, 'horizontalRotation')
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