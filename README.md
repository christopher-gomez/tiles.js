# tiles.js
![alt text](https://raw.githubusercontent.com/christophgomez/tiles.js/master/map.png)

A 3D tile map JavaScript engine created with [Three.js](https://threejs.org/). 

Keep an eye on it's progress and updates by checking the [sandbox](https://christophgomez.github.io/tiles.js/) every now and then.

Or run it locally by downloading, installing the requirements, and running it on localhost: 
```
$ git clone https://github.com/christophgomez/tiles.js.git
$ cd tiles.js
$ npm install
$ npm run startSandbox
```

## Why
This project is a personal hobby project of mine that developed out of the interest to develop a Steam game with the tools and languages I know and love (modern web technologies).

The engine uses Three.js for WebGL rendering, Webpack and Babel in order to utilize modern ES6/7 and TypeScript language features, and runs on React in the browser (or plain old HTML) or natively on the desktop thanks to Electron. 

The goal is a a highly performant engine that can be used to render 3D polygonal tile scenes with easy to follow documentation so anyone with some programming experience can render tile maps.

#### But why modern web tech, why JavaScript? Why not Unity or Unreal?
Simple. I love JavaScript and the web. With JavaScript you have the ability to reach nearly person in the world because JavaScript runs on virtually every computing device worldwide. Furthermore, JavaScript's standard package manager, NPM, has more packages than Java and PHP combined, most of them open source and freely available for use in any project. Harnessing the power of npm and node allows for faster, smarter development. 



## Acknowledgments
[Cory Birnbaum](https://github.com/vonWolfehaus) - He did most of the hard work a couple years ago. Thank you for the grid system and utility functions. They have proved invaluable.
