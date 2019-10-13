# Animation

<div class='description'>
A utility class for animations. Pass a function into the constructor to run that function smoothly over the given duration.<br><br>
Hint: Use lerp with the progress parameter in the update to function for very smooth animations.
</div>

### Constructor
<hr style='width:100%; opacity:.5;' />

`Animation(durationMs: number, update: (progress: number) => void, easingFunction = Animation.easeInOutQuad)`

### Properties
<hr style='width:100%; opacity:.5;' />

`static .easeInOuQuad = (t: number) => number`

`static .easeLinear = (t: number) => number`

`.progress: number`

### Methods
<hr style='width:100%; opacity:.5;' />

`.animate(dtS: number): boolean`
