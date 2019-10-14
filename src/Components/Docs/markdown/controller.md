# Controller

<div class='description'>
The Controller portion of the MVC pattern. The Controller class acts as a container object for some custom Three.js OrbitControls.<br><br>
This class should be mostly ignored, as the View automatically takes care of most of it, so you should be using the View to interact with the Controller most of the time, unless you really need to implement some custom controls.
</div>

## Constructor
<hr style='width:100%; opacity:.5;' />

`Controller(view: View, config?: CameraControlSettings)`

<small>
view - (required) The View that this Controller object is controlling.<br>
config - (optional) An object with one or more properties defining the Controller's properties. 
</small> 

## Properties
<hr style='width:100%; opacity:.5;' />

`.active: boolean`

`.controls: OrbitControls`

## Methods
<hr style='width:100%; opacity:.5;' />

`.dispose(): void`

`.panCameraTo(tile: Tile | Cell, durationMs: number): void`

`.panInDirection(left: boolean, right: boolean. top: boolean, bottom: boolean): void`

`.rotateUp(angle: number): void`

`.toggleControls(): void`

`.toggleHorizontalRotation(active: boolean): void`

`.update(): void`

`.updateControlSettings(config: CameraControlSettings): void`