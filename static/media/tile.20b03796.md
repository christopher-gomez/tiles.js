## Tile

<div class='description'>
The mighty Tile class. The Tile is the physical (virtual) representation of a Cell.<br><br>
 Use them. Create with them. 
</div>

### Constructor
<hr style='width:100%; opacity:.5;' />

`Tile(config? TileSettings)`

### Properties
<hr style='width:100%; opacity:.5;' />

`.cell: Cell`

`.entity: any`

`.geometry: Geometry`

`.highlight: number`

`.material: Material`

`.mesh: Mesh`

`.objectType: string`

`.position: Vector3`

`.rotation: Euler`

`.selected: boolean`

`.uniqueID: string`

`.userData: {}`

### Methods
<hr style='width:100%; opacity:.5;' />

`.deselect(): Tile`

`.dispose(): void`

`.select(): Tile`

`.setTerrain(e: number, m: number)`

`.toggle(): Tile`
