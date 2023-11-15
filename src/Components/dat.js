import * as dat from "dat.gui";
import View from "../lib/scene/View";
import { ControllerEvent } from "../lib/scene/Controller";

export default class GUI {
  /**
   *
   * @param {*} options
   * @param {View} scene
   */
  constructor(options, scene) {
    this.gui = new dat.GUI({ autoPlace: false });
    document.getElementById("gui").append(this.gui.domElement);
    document.getElementById("gui").addEventListener(
      "mousedown",
      (e) => {
        e.stopPropagation();
      },
      false
    );
    const camGUI = this.gui.addFolder("Camera");
    camGUI.add(scene.camera.position, "x").step(10).listen();
    camGUI.add(scene.camera.position, "y").step(10).listen();
    camGUI.add(scene.camera.position, "z").step(10).listen();
    const orbitControls = camGUI.addFolder("Control");
    orbitControls
      .add(options, "controlled")
      .name("Enabled")
      .onChange(() => {
        scene.toggleControls();
      });
    // orbitControls
    //   .add(options, "enableDamping")
    //   .name("Damping")
    //   .onChange((val) => {
    //     scene.updateControlSettings({ enableDamping: val });
    //   });
    // orbitControls
    //   .add(options, "dampingFactor", 0, 1)
    //   .step(0.01)
    //   .name("Damping Factor")
    //   .onChange((val) => {
    //     scene.updateControlSettings({ dampingFactor: val });
    //   });

    /* Here is the update */
    const setCurrentDistance = function (val) {
      for (let i = 0; i < orbitControls.__controllers.length; i++) {
        if (orbitControls.__controllers[i].property == "currentDistance")
          orbitControls.__controllers[i].setValue(val);
        orbitControls.__controllers[i].updateDisplay();
      }
    };

    let setCurrentDistanceMin = function (val) {
      for (let i = 0; i < orbitControls.__controllers.length; i++) {
        if (orbitControls.__controllers[i].property == "currentDistance")
          orbitControls.__controllers[i].min(val);
        orbitControls.__controllers[i].updateDisplay();
      }
    };

    let setCurrentDistanceMax = function (val) {
      for (let i = 0; i < orbitControls.__controllers.length; i++) {
        if (orbitControls.__controllers[i].property == "currentDistance")
          orbitControls.__controllers[i].max(val);
        orbitControls.__controllers[i].updateDisplay();
      }
    };

    orbitControls
      .add(options, "currentDistance", options.minDistance, options.maxDistance)
      .step(10)
      .name("Cur Distance")
      .onChange((val) => {
        scene.controller.currentDistance = val;
      });

    scene.controller.addEventListener(ControllerEvent.ZOOM, (args) => {
      setCurrentDistance(args.currentDistance);
    });

    let setMinDistanceMax = function (val) {
      for (let i = 0; i < orbitControls.__controllers.length; i++) {
        if (orbitControls.__controllers[i].property == "minDistance")
          orbitControls.__controllers[i].max(val);
        orbitControls.__controllers[i].updateDisplay();
      }
    };

    orbitControls
      .add(options, "minDistance", 20, options.maxDistance)
      .step(10)
      .name("Max Zoom In")
      .onChange((val) => {
        scene.updateControlSettings({ minDistance: val });
        setCurrentDistanceMin(val);
        setMaxDistanceMin(val);
      });

    let setMaxDistanceMin = function (val) {
      for (let i = 0; i < orbitControls.__controllers.length; i++) {
        if (orbitControls.__controllers[i].property == "maxDistance")
          orbitControls.__controllers[i].min(val);
        orbitControls.__controllers[i].updateDisplay();
      }
    };

    orbitControls
      .add(options, "maxDistance", options.minDistance, 1000)
      .step(10)
      .name("Max Zoom Out")
      .onChange((val) => {
        scene.updateControlSettings({ maxDistance: val });
        setCurrentDistanceMax(val);
        setMinDistanceMax(val);
      });

    orbitControls
      .add(options, "zoomSpeed", 0, 20)
      .step(1)
      .name("Zoom Amount")
      .onChange((val) => {
        scene.updateControlSettings({ zoomDelta: val });
      });

    orbitControls
      .add(options, "hotEdges")
      .name("Edge Scroll")
      .onChange((val) => {
        scene.updateControlSettings({ hotEdges: val });
      });

    orbitControls
      .add(options, "autoRotate")
      .name("Auto Rotate")
      .onChange((val) => {
        scene.updateControlSettings({ autoRotate: val });

        if (val === true) {
          options.horizontalRotation = true;
        } else {
          options.horizontalRotation = false;
        }
      });

    // orbitControls
    //   .add(options, "screenSpacePanning")
    //   .name("Screen Space Panning")
    //   .onChange((val) => {
    //     scene.updateControlSettings({ screenSpacePanning: val });
    //   });

    let setCurrentPolarAngle = function (val) {
      for (let i = 0; i < orbitControls.__controllers.length; i++) {
        if (orbitControls.__controllers[i].property == "currentPolarAngle")
          orbitControls.__controllers[i].setValue(val);
        orbitControls.__controllers[i].updateDisplay();
      }
    };

    orbitControls
      .add(
        options,
        "currentPolarAngle",
        options.minPolarAngle,
        options.maxPolarAngle
      )
      .step(1)
      .name("Cur Polar Angle")
      .onChange((val) => {
        scene.controller.currentPolarAngle = val;
      });

    scene.controller.addEventListener(ControllerEvent.ZOOM, (args) => {
      setCurrentPolarAngle(args.currentPolarAngle);
    });

    orbitControls
      .add(options, "minPolarAngle", 0, 180)
      .step(1)
      .name("Min Polar Angle")
      .onChange((val) => {
        val = (val * Math.PI) / 180;
        scene.updateControlSettings({ minPolarAngle: val });
      });
    orbitControls
      .add(options, "maxPolarAngle", 0, 180)
      .step(1)
      .name("Max Polar Angle")
      .onChange((val) => {
        val = (val * Math.PI) / 180;
        scene.updateControlSettings({ maxPolarAngle: val });
      });
    orbitControls
      .add(options, "minAzimuthAngle", -180, 180)
      .step(1)
      .name("Min Azimuth Angle")
      .onChange((val) => {
        val = (val * Math.PI) / 180;
        scene.updateControlSettings({ minAzimuthAngle: val });
      });
    orbitControls
      .add(options, "maxAzimuthAngle", -180, 180)
      .step(1)
      .name("Max Azimuth Angle")
      .onChange((val) => {
        val = (val * Math.PI) / 180;
        scene.updateControlSettings({ maxAzimuthAngle: val });
      });
    orbitControls
      .add(options, "horizontalRotation")
      .name("Hor. Rotation")
      .onChange((val) => {
        scene.toggleHorizontalRotation(val);
      })
      .listen();
    const worldGUI = this.gui.addFolder("World");
    worldGUI.addFolder("Grid/Map");
    worldGUI.addFolder("Terrain");
    camGUI.open();
    orbitControls.open();
  }
}
