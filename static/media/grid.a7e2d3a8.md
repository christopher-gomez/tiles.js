# Grid

<div class='description'>
A wrapper class for HexGrid and SqrGrid. Used to encapsulate all Grid properties and methods in one generic Grid object.<br/><br/>
This object represents a grid in virtual space, it is <i>not</i> the grid of 3D tiles that is rendered, but rather a collection of Cells in a hash table and some grid math operations. The Map class uses a Grid to render Cells as tiles at their respective coordinates.<br><br>
You should <b>not</b> be using the Grid object too often, if you are, maybe the Map should do it instead?
</div>

## Constructor
<hr style='width:100%; opacity:.5;' />

`Grid(config?: GridSettings)`

<small>
config - (optional) An object with one or more properties defining the Grid's properties.  
</small>

## Properties
<hr style='width:100%; opacity:.5;' />

`.gridShape: string`

<small>
A string describing the shape of the grid. Possible values are "sqr", "rect", "hex", and "abs".<br/>
Default is <b>"hex"</b>.
</small>

`.gridSize: number`

<small>
How large the grid is.<br>
Default is <b>10</b>. 
</small>

`.cellSize: number`

<small>
How large each cell is.<br>
Default is <b>10</b>.
</small>

`.cells: { [key: string]: Cell }`

<small>
An associative array, where the key is the Cell's vector coordinates. 
</small>

`.numCells: number`

<small>
How many cells in the grid.
</small>

`.extrudeSettings: ExtrudeSettings`

<small>
An object with properties that describe how much each tile extrudes.<br/>
Used by Map to render Cells in 3D space. 
</small>

`.cellShape: string`

<small>
A string describing the shape of each cell. Possible values are "sqr", "rect", "hex". <br/>
Default is <b>"hex"</b>.
</small>

`.cellGeo: BufferGeometry`

`.cellShapeGeo: ShapeGeometry`

## Methods
<hr style='width:100%; opacity:.5;' />

`.add(cell: Cell): Cell`

<small>
Adds a Cell to the grid and returns it.
</small>

`.cellToHash(cell: Cell): string`

<small>
Takes a Cell and returns a hash value to store it in the associative array with.
</small>

`.cellToPixel(cell: Cell): Vector3`

<small>
Takes a Cell and converts that Cell's Grid coordinates to 3D space coordinates. (x, y, z)
</small>

`.clearPath(): void`

<small>
Used by the AStarFinder to clear the old values of previous pathfind.
</small>

`.dispose(): void`

<small>
Disposes buffers, associative array, and geometry and material caches.
</small>

`.distance(cellA: Cell, cellB: Cell): number`

<small>
Takes two Cells and returns the Euclidean distance between them. 
</small>

`.generateGrid(config?: GridSettings): void`

<small>
Generates a flat Grid in virtual space.<br/>
Called from the constructor. Call this with a new config to create a different grid.<br/><br/>
config - (optional) An object with one or more properties defining the Grid's properties.
</small>  

`.generateOverlay(size: number, overlayObj: Object3D, overlayMat: Material): void`

<small>
Generates an 3D group of lines over the Cells.<br/>
Useful if you want to render flat terrain instead of physical tiles, but still want to render hex cells. 
</small>

`.generateTiles(config?: MapSettings): Tile[]`

<small>
Generates and returns an array of Tiles.<br/>
Called automatically by Map when a Grid is passed into it.<br/><br/>
config - (optional) An object with one or more properties defining the physical representation of the cell on the map.
</small>

`.getNeighbors(cell: Cell, diagonals?: boolean, heuristicFilter?: (origin: Cell, next: Cell) => boolean): Cell[]`

<small>
Returns an array of Cells that are neighbors to the cell passed in the parameter.<br/>
Used by AStarFinder for pathfinding<br/><br>
diagonals - (optional) pass false to filter out diagonal neighbors<br/>
heurisiticFilter - (optional) A function that takes the original Cell, and the Cell in question and returns true/false to filter out neighbors based on specific parameters.
</small>

`.getRandomCell(): Cell`

<small>
Returns a random Cell in the Grid.
</small>

`.pixelToCell(pos: Vector3): Cell`

<small>
Takes a 3D coordinate and returns the Cell that contains that location.
</small>

`.remove(cell: Cell): Cell`

<small>
Takes a Cell reference, removes it from the Grid, and returns it.
</small>

`.traverse(cb: (cell: Cell) => void): void`

<small>
Traverse the entire grid, perform a function at each Cell. 
</small>
