## Cell

<div class='description'>
The most basic unit of the Grid. Many Cells make up the Grid, the Grid makes the Map.<br><br> 
Grid logic and render logic are kept seperate with math logic going in the Cell class and graphics logic going in the Tile class.
</div>

### Constructor
<hr style='width:100%; opacity:.5;' />

`Cell(q?: number, r?: number, s?: number, h?: number)`


### Properties
<hr style='width:100%; opacity:.5;' />

`.q: number`

`.r: number`

`.s: number`

`.h: number`

`.tile: tile`

`.uniqueID: string`

`.userData: {}`

`.walkable: boolean`


### Methods
<hr style='width:100%; opacity:.5;' />

`.add(cell: Cell): Cell`

`.copy(cell: Cell): Cell`

`.equals(cell: Cell): boolean`

`.resetPath(): void`

`.set(q: number, r: number, s: number): Cell`
