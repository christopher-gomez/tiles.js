# Tiles.js

<div class='description'>
Tiles.js is a simple to use 3D tile map engine.<br><br>
Mostly documenting for my own reference.<br><br>
Please bear with me while I build the documentation components.<br>(Rendering Markdown in React is just as fun as 3D rendering!)
</div>

<a id='start'></a>

## Getting Started

<div class='description'>
This library is still under development and incomplete.<br/><br/>
I plan on eventually releasing it as a package on npm, along with a minified version on a CDN, after I've released a Steam game with it.<br/><br>
If you still want to play around with it, you can clone or download it from it's <a href='https://github.com/christophgomez/tiles.js' target="_blank" rel="nofollow noopener noreferrer">repo</a> on GitHub and include it directly in your project.
</div>

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
