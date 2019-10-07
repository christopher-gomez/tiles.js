# Tiles.js

<div class='description'>
Tiles.js is a simple to use 3D tile map engine.
</div>

<a id='start'></a>

## Getting Started

<div class='description'>
This library is still under development and thus, incomplete.<br/><br/>
Eventually, I plan on releasing it as a package on npm, along with a minified version on a CDN.
</div>

If you still want to fiddle around with it or contribute to it's development, you can clone or download it from it's [repo](https://github.com/christophgomez/tiles.js) on GitHub and include it directly in your project.

<a id='example'></a>

## Example

```javascript
import Engine from 'tiles.js'; // Or wherever you have it saved './lib/tiles.js'
// or only import what you need
// import {Grid, Map, View} from 'tiles.js';

const grid = new Engine.Grid();
const map = new Engine.Map(grid);
const scene = new Engine.View(map);

scene.focusOn(map.group);
```
