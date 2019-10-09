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
If you still want to play around with it, you can clone or download it from it's <a href='https://github.com/christophgomez/tiles.js' target="_blank" rel="nofollow noopener noreferrer">repo</a> on GitHub and include it directly in your project. Bug reports and pull requests are always welcome. 
</div>

## Installation

<div class='description'>
To get a local development build running, simply download it from the <a href='https://github.com/christophgomez/tiles.js' target="_blank" rel="nofollow noopener noreferrer">GitHub</a> by following these instructions:
</div>

```bash
$ git clone https://github.com/christophgomez/tiles.js.git
$ cd tiles.js-master
$ npm install
$ npm run startSandbox
```

<div class='description'>
A browser window should automatically open and navigate to http://localhost:3000.<br><br>
Once that's open, feel free to mess around with the lib folder in the src folder, that's the source code.<br>
Or import the built code into one of the React components (or plain HTML file) and start building something cool with Tiles!
</div>

<a id='example'></a>

## Example

```javascript
import Engine from 'tiles.js'; // Or wherever you have it saved './lib/tiles.js'
// or only import what you need
// import {Grid, Map, View} from 'tiles.js';

const grid = new Engine.Grid({
  gridShape: Engine.HEX,
  gridSize: 50,
  cellSize: 5
});
const map = new Engine.Map(grid);
const scene = new Engine.View(map);

scene.focusOn(map.group);
```
