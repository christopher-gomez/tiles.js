# AnimationManager

<div class='description'>
The AnimationManager class manages the engine animation loop and provides the ability to the specify and manage functions to execute before the next repaint. 
</div>

## Constructor

`AnimationManager(renderer: Renderer, container: Scene, camera: Camera, onAnimate?: (dtS: number) => void)`

## Properties

`.animations: Animation[]`

`.onAnimate: { [id: string]: cb: (dtS: number) => void }`

<small>
A list of functions to be executed once before every repaint.<br>When the object is created, two functions are added to the list for smoothly playing animations and reacting to mouse events. Add additional functions as needed. 
</small>

`.paused: boolean`

## Methods

`.addAnimation(animation: Animation): void`

<small>
Adds an animation into the queue of animations waiting to be played. 
</small>

`.addOnAnimate(cb: (dtS: number) => void): string`

<small>
cb - (required) A function to execute before every repaint. This function will be passed a delta time stamp.<br>
Returns a unique ID to identify the entry in the callback list should you need to cancel the function in the future.
</small>

`.animate(timestamp: number): void`

<small>
Begins the animation loop at the given timestamp. Called internally by View with 0. Funky things will happen if you call it. Try not to. 
</small>

`.cancelAnimation(): void`

<small>
Cancels the currently running animation.
</small>

`.cancelOnAnimate(id: string): void`

<small>
Removes the function with the specified id from the callback list. 
</small>

`.dispose()`

<small>
Cancels the animation loop and deletes all animations. 
</small>