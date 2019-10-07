<a id='grid'></a>

# Grid
A wrapper class for HexGrid and SqrGrid. Used to encapsulate all Grid properties and methods in one generic Grid object. 

This object represents a grid in virtual space, it is <i>not</i> the grid of 3D tiles that is rendered, but rather a collection of Cells in a hash table and some grid math operations. The Map class uses a Grid to render tiles at their respective coordinates. 

## Constructor
<hr style='width:100%; opacity:.5;' />

Grid (config?: GridSettings)

<small>
config - (optional) An object with one or more properties defining the Grid's properties.  
</small>

## Properties
<hr style='width:100%; opacity:.5;' />

.gridShape: string

<small>
A string describing the shape of the grid. Possible values are "sqr", "rect", "hex", and "abs".<br/>
Default is <b>"hex"</b>.
</small>

.gridSize: number

<small>
How large the grid is.<br>
Default is <b>10</b>. 
</small>

.cellSize: number

<small>
How large each cell is.<br>
Default is <b>10</b>.
</small>

.cells: { `[key: string]`: Cell }

<small>
An associative array, where the key is the Cell's vector coordinates. 
</small>

.numCells: number

<small>
How many cells in the grid.
</small>

.extrudeSettings: ExtrudeSettings

<small>
An objects with properties that describe how much each tile extrudes.
</small>

.cellShape: string

<small>
A string describing the shape of each cell. Possible values are "sqr", "rect", "hex". <br/>
Default is <b>"hex"</b>.
</small>

.cellGeo: BufferGeometry

.cellShapeGeo: ShapeGeometry

## Methods
<hr style='width:100%; opacity:.5;' />

.cellToPixel(cell: Cell): Vector3

.add(cell: Cell): Cell

.remove(cell: Cell): void

.cellToHash(cell: Cell): string

.pixelToCell(pos: Vector3): Cell

.dispose(): void

.generateOverlay(size: number, overlayObj: Object3D, overlayMat: Material): void

.generateTiles(tilemapSettings: MapSettings): Tile[]

.generateGrid(config: GridSettings): void

.clearPath(): void

.getNeighbors(cell: Cell, diagonals: boolean, heuristic: Function): Cell[]

.distance(cellA: Cell, cellB: Cell): number
