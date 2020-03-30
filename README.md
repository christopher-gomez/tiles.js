# tiles.js
![alt text](https://raw.githubusercontent.com/christophgomez/tiles.js/master/map.png)

A 3D tile map JavaScript engine created with [Three.js](https://threejs.org/). 

## Still Very Much in Development !

Keep an eye on it's progress and updates by checking the [sandbox](https://christophgomez.github.io/tiles.js/) every now and then.

Or run it locally by downloading, installing the dependncies, and running it on localhost: 
```bash
$ git clone https://github.com/christophgomez/tiles.js.git
$ cd tiles.js-master
$ npm install
$ npm run start-sandbox
```

## Why
This project is a personal hobby project of mine that developed out of the interest to develop a Steam game with the tools and languages I know and love (modern full-stack web technologies).

The engine uses Three.js for WebGL rendering, Webpack and Babel in order to utilize modern ESNext and TypeScript language features, and runs on React in the browser (or plain old HTML) or natively on the desktop thanks to Electron. 

The goal is a a highly performant engine that can be used to render 3D polygonal tile scenes with easy to follow documentation so anyone with some programming experience can render tile maps.

#### But why modern web tech, why JavaScript? Why not Unity or Unreal?
Simple. I love JavaScript and the web. With JavaScript you have the ability to reach nearly every person in the world with access to a computer because JavaScript runs on virtually every computing device worldwide. Furthermore, JavaScript's standard package manager, npm, has more packages than Java and PHP combined, most of them open source and freely available for use in any project. Harnessing the power of npm and Node allows for faster, smarter development. 



## Acknowledgments
- [Cory Birnbaum](https://github.com/vonWolfehaus) - Much of the underlying grid code and utility functions come from Cory's excellent von-grid system.
- [Amit Patel](https://github.com/amitp) - Of course, almost everyone on the web owes some thanks to Amit's excellent website and hex map resources on grid math, procedural generation, and map implementations and algorithms. [(Red Blob Games)](https://www.redblobgames.com/) 

### TODO:
- Map Chunks
- Biomes
- Textures
- Better world generation (better solution than Perlin noise? Tectonic plate modeling)
  - Import map image for tile map generation feature