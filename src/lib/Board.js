import * as THREE from 'three';
import TM from './tm';

export default class Board {
  constructor(grid, finderConfig) {
    if (!grid) throw new Error('You must pass in a grid system for the board to use.');

    this.tiles = [];
    this.tileGroup = null; // only for tiles

    this.group = new THREE.Object3D(); // can hold all entities, also holds tileGroup, never trashed

    this.grid = null;
    this.overlay = null;
    this.finder = new TM.AStarFinder(finderConfig);
    // need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
    TM.Loader.init();

    this.setGrid(grid);
  }
  setEntityOnTile(entity, tile) {
    // snap an entity's position to a tile; merely copies position
    var pos = this.grid.cellToPixel(tile.cell);
    entity.position.copy(pos);
    // adjust for any offset after the entity was set directly onto the tile
    entity.position.y += entity.heightOffset || 0;
    // remove entity from old tile
    if (entity.tile) {
      entity.tile.entity = null;
    }
    // set new situation
    entity.tile = tile;
    tile.entity = entity;
  }

  addTile(tile) {
    var i = this.tiles.indexOf(tile);
    if (i === -1) this.tiles.push(tile);
    else return;

    this.snapTileToGrid(tile);
    tile.position.y = 0;

    this.tileGroup.add(tile.mesh);
    this.grid.add(tile.cell);

    tile.cell.tile = tile;
  }

  removeTile(tile) {
    if (!tile) return; // was already removed somewhere
    var i = this.tiles.indexOf(tile);
    this.grid.remove(tile.cell);

    if (i !== -1) this.tiles.splice(i, 1);
    // this.tileGroup.remove(tile.mesh);

    tile.dispose();
  }

  removeAllTiles() {
    if (!this.tileGroup) return;
    var tiles = this.tileGroup.children;
    for (var i = 0; i < tiles.length; i++) {
      this.tileGroup.remove(tiles[i]);
    }
  }

  getTileAtCell(cell) {
    var h = this.grid.cellToHash(cell);
    return cell.tile || (typeof this.grid.cells[h] !== 'undefined' ? this.grid.cells[h].tile : null);
  }

  snapToGrid(pos) {
    var cell = this.grid.pixelToCell(pos);
    pos.copy(this.grid.cellToPixel(cell));
  }

  snapTileToGrid(tile) {
    if (tile.cell) {
      tile.position.copy(this.grid.cellToPixel(tile.cell));
    }
    else {
      var cell = this.grid.pixelToCell(tile.position);
      tile.position.copy(this.grid.cellToPixel(cell));
    }
    return tile;
  }

  getRandomTile() {
    var i = TM.Tools.randomInt(0, this.tiles.length - 1);
    return this.tiles[i];
  }

  findPath(startTile, endTile, heuristic) {
    return this.finder.findPath(startTile.cell, endTile.cell, heuristic, this.grid);
  }

  setGrid(newGrid) {
    this.group.remove(this.tileGroup);
    if (this.grid && newGrid !== this.grid) {
      this.removeAllTiles();
      this.tiles.forEach(function (t) {
        this.grid.remove(t.cell);
        t.dispose();
      });
      this.grid.dispose();
    }
    this.grid = newGrid;
    this.tiles = [];
    this.tileGroup = new THREE.Object3D();
    this.group.add(this.tileGroup);
  }

  generateOverlay(size) {
    var mat = new THREE.LineBasicMaterial({
      color: 0x000000,
      opacity: 0.9
    });

    if (this.overlay) {
      this.group.remove(this.overlay);
    }

    this.overlay = new THREE.Object3D();

    this.grid.generateOverlay(size, this.overlay, mat);

    this.group.add(this.overlay);
  }

  generateTilemap(config) {
    this.reset();

    var tiles = this.grid.generateTiles(config);
    this.tiles = tiles;

    this.tileGroup = new THREE.Object3D();
    for (var i = 0; i < tiles.length; i++) {
      this.tileGroup.add(tiles[i].mesh);
    }

    this.group.add(this.tileGroup);
  }

  generateTerrain() {
    // reset terrain eventually

    if (this.grid.type === TM.HEX) {
      var size = this.grid.size;
      var x, y, z;
      let i = 0;
      for (x = -size; x < size + 1; x++) {
        for (y = -size; y < size + 1; y++) {
          z = -x - y;
          if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
            var nx = x / this.grid._cellWidth - 0.5, ny = z / this.grid._cellLength - 0.5;
            var e = (1.00 * TM.Tools.noise1(1 * nx, 1 * ny)
              + 0.50 * TM.Tools.noise1(2 * nx, 2 * ny)
              + 0.25 * TM.Tools.noise1(4 * nx, 4 * ny)
              + 0.13 * TM.Tools.noise1(8 * nx, 8 * ny)
              + 0.06 * TM.Tools.noise1(16 * nx, 16 * ny)
              + 0.03 * TM.Tools.noise1(32 * nx, 32 * ny));
            e /= (1.00 + 0.50 + 0.25 + 0.13 + 0.06 + 0.03);
            e = Math.pow(e, 5.00);
            var m = (1.00 * TM.Tools.noise2(1 * nx, 1 * ny)
              + 0.75 * TM.Tools.noise2(2 * nx, 2 * ny)
              + 0.33 * TM.Tools.noise2(4 * nx, 4 * ny)
              + 0.33 * TM.Tools.noise2(8 * nx, 8 * ny)
              + 0.33 * TM.Tools.noise2(16 * nx, 16 * ny)
              + 0.50 * TM.Tools.noise2(32 * nx, 32 * ny));
            m /= (1.00 + 0.75 + 0.33 + 0.33 + 0.33 + 0.50);
            this.tiles[i].setTerrain(e, m);
            i++;
          }
        }
      }
    }
  }

  reset() {
    // removes all tiles from the scene, but leaves the grid intact
    this.removeAllTiles();
    if (this.tileGroup) this.group.remove(this.tileGroup);
  }
}