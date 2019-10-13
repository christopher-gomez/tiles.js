# MouseCaster

<div class='description'>
The MouseCaster class serves as a wrapper for the Three.js ray casting system.<br><br>
Currently, View does all the heavy lifting when it comes to the MouseCaster. Future updates include allowing for engine users to pass their own event callbacks or their own custom MouseCaster object into the View animation loop.
</div>

## Constructor
<hr style='width:100%; opacity:.5;' />

`.MouseCaster(group: Object3D, camera: Camera, element: HTMLElement)`

## Properties
<hr style='width:100%; opacity:.5;' />

`.active: boolean`

`.allHits: Intersection[]`

`.ctrl: boolean`

`.down: boolean`

`.element: HTMLElement`

`.group: Object3D`

`.pickedObject: Tile`

`.position: Vector3`

`.rightDown: boolean`

`.selectedObject: Tile`

`.screenPosition: Vector2`

`.shift: boolean`

`.signal: Signal`

`.wheel: number`

## Methods
<hr style='width:100%; opacity:.5;' />

`.dispose()`

`.raycast()`

`.update()`