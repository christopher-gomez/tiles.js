<a id='map'></a>

# Map

<div class='description'>
The Map class represents the model in the MVC pattern. It takes a Grid object and renders the Cells as 3D Tiles in an Object3D group.<br><br>
This class is meant to be used in place of drilling down into the Grid level. Mouse events live on the Cell level, this class provides the bridge to convert those pixels into game Tiles.<br><br>
The object this class creates is meant to be used to interact with the Map in the rendering, 
</div>

## Constructor
<hr style='width:100%; opacity:.5;' />

Map (grid: GridInterface, mapConfig?: MapSettings, finderConfig?: PathfinderSettings)

<small>
grid - (required) Any grid object that implements GridInterface.<br>
mapConfig - (optional) An object with one or more properties describing the Map's properties.<br>
finderConfig - (optional) An object with one or more properties describing the Pathfinder's properties.
</small>

## Properties
<hr style='width:100%; opacity:.5;' />

.grid: GridInterface

<small>
The current Grid object the Map is rendering.<br>Can by any Grid that implements the GridInterface. 
</small>

.pathFinder: AStarFinder

<small>
The pathFinder object, of type AStarFinder. Used for pathfinding. (using A* search) 
</small>

.tiles: Tile[]

<small>
An array of Tiles, for every tile on the Map. 
</small>

.group: Object3D

<small>
A container Object3D for the tileGroup and tileOverlay objects.
</small>

.tileGroup: Object3D

<small>
A container object for every Tile mesh.
</small>

.tileOverlay: Object3D

<small>
A collection of lines overlaying the Cells.
</small>

## Methods
<hr style='width:100%; opacity:.5;' />

.addTile(tile: Tile): void

.dispose(): void

.findPath(startTile: Tile, endTile: Tile, heuristic: (origin: Cell, next: Cell) => {}): Cell[][]

.generateOverlay(size: number): void

.generateTiles(config?: MapSettings): void

.getRandomTile(): Tile

.getTileAtCell(cell: Cell): Tile

.removeAllTiles(): void

.removeTile(tile: Tile): void

.reset(): void

<small>
removes all tiles from the scene, but leaves the grid intact
</small>

.setEntityOnTile(entity: any, tile: Tile): void

.setGrid(newGrid: GridInterface): void

<small>
Called from the constructor, but can be used to create a new map.
</small>

.snapTileToGrid(tile: Tile): Tile

.snapToGrid(pos: Vector3): void