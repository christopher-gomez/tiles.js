# AStarFinder

<div class='description'>
The AStarFinder is a class used by the Grid and the Map for pathfinding, but could theoretically be used for any entity that requires pathfinding abilities on the Grid (AI).<br><br>
If a filter function is provided, the pathfinder will use A* search with the filter as the heuristic to select the most optimal path.
</div>

## Constructor
<hr style='width:100%; opacity:.5;' />

`.AStarFinder(finderConfig?: PathfinderSettings)`

## Properties
<hr style='width:100%; opacity:.5;' />

`.allowDiagonal: boolean`

`.heuristicFilter: (origin: Cell, next: Cell) => boolean`

`.list: LinkedList`

## Methods
<hr style='width:100%; opacity:.5;' />

`.compare(nodeA: Cell, nodeB: Cell): number`

`.findPath(startNode: Cell, endNode: Cell, heuristic: (origin: Cell, next: Cell) => boolean, grid: GridInterface): Cell[][]`
