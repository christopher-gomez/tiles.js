import React from 'react';
import './App.css';
import TM from './lib/tm.ts';

class App extends React.Component {
  componentDidMount() {
    this.scene = new TM.Scene({
      element: document.getElementById('view'),
      cameraPosition: { x: 0, y: 150, z: 150 }
    }, true);

    // this constructs the cells in grid coordinate space
    this.gridSpace = new TM.HexGrid({
      cellSize: 5 // size of individual cells
    });

    this.gridSpace.generate({
      size: 75 // size of the board
    });

    this.mouse = new TM.MouseCaster(this.scene.container, this.scene.camera);
    this.board = new TM.Board(this.gridSpace);

    // this will generate extruded hexagonal tiles
    this.board.generateTilemap({
      tileScale: .965 // you might have to scale the tile so the extruded geometry fits the cell size perfectly
    });
    this.board.generateTerrain();
    //this.board.generateOverlay(45);

    this.scene.add(this.board.group);
    this.scene.focusOn(this.board.group);

    this.mouse.signal.add(function (evt, tile) {
      if (evt === TM.MouseCaster.CLICK) {
        tile.toggle();
        // or we can use the mouse's raw coordinates to access the cell directly, just for fun:
        //const cell = this.board.grid.pixelToCell(this.mouse.position);
        //const t = this.board.getTileAtCell(cell);
        //if (t) t.toggle();
      }
    }, this);

    this.update();
  }
  update() {
    this.mouse.update();
    this.scene.render();
    requestAnimationFrame(() => {
      this.update();
    });
  }
  render() {
    return (
      <div className="App">
        <div id='view'></div>
      </div>
    );
  }
}

export default App;
