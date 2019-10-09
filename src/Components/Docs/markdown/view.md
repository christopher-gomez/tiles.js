<a id='view'></a>

# View

<div class='description'>
The View portion of the MVC pattern. The View class acts as a container for the Three.js Scene and Camera system.<br><br>
The View also implements the ViewController interface, allowing for all Controlling to be done through the View, and worrying about one less object. Direct access to the Controller class is still available of course, these wrapper methods are for convenience and because the View and Controller are so intrinsically linked in this type of engine. 
</div>

## Constructor
<hr style='width:100%; opacity:.5;' />

`View(map: Map, viewConfig?: ViewSettings)`

<small>
map - (required) A Map object to render.<br> 
viewConfig - (optional) An object with one or more properties describing the View's properties.
</small>

## Properties
<hr style='width:100%; opacity:.5;' />

`.camera: Camera`

`.container: Scene`

`.controlled: boolean;`

`.controls: Controller`

`.height: number;`

`.hotEdges: boolean;`

`.map: Map`

`.mouseCaster: MouseCaster`

`.onAnimate: (dtS: number) => void`

`.onLoaded: cb: () => void`

`.onTileSelected: cb: (tile: Tile) => void`

`.renderer: WebGLRenderer`

`.selectedTile: Tile`

`.settings: ViewSettings`

`.width: number`

## Methods
<hr style='width:100%; opacity:.5;' />
