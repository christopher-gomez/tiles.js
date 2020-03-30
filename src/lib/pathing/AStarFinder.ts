import PathUtil from './PathUtil';
import { PathfinderSettings, heuristic } from '../utils/Interfaces';
import LinkedList from '../lib/LinkedList';
import Tools from '../utils/Tools';
import Cell from '../grids/Cell';
import { GridInterface } from '../grids/Grid';
/*
	A* path-finder based upon http://www.redblobgames.com/pathfinding/a-star/introduction.html
	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
// 'utils/Tools', 'lib/LinkedList'

export default class AStarFinder {
	public allowDiagonal: boolean;
	public heuristicFilter: heuristic;
	public list: LinkedList;

	constructor(finderConfig?: PathfinderSettings) {
		let settings = {
			allowDiagonal: false,
			heuristicFilter: null as heuristic,
		} as PathfinderSettings;
		if (finderConfig)
			settings = Tools.merge(settings, finderConfig) as PathfinderSettings;

		this.allowDiagonal = settings.allowDiagonal;
		this.heuristicFilter = settings.heuristicFilter;

		this.list = new LinkedList();
	}
	/*
		  Find and return the path.
		  @return Array<Cell> The path, including both start and end positions. Null if it failed.
	   */
	findPath(startNode: Cell, endNode: Cell, heuristic: heuristic, grid: GridInterface): Cell[][] {
		let current, costSoFar, neighbors, n, i, l;
		heuristic = heuristic || this.heuristicFilter;
		// clear old values from previous finding
		grid.clearPath();
		this.list.clear();

		// push the start current into the open list
		this.list.add(startNode);

		// while the open list is not empty
		while (this.list.length > 0) {
			// sort so lowest cost is first
			this.list.sort(this.compare);

			// pop the position of current which has the minimum `_calcCost` value.
			current = this.list.shift().obj;
			current._visited = true;

			// if reached the end position, construct the path and return it
			if (current === endNode) {
				return PathUtil.backtrace(endNode);
			}

			// cycle through each neighbor of the current current
			neighbors = grid.getNeighbors(current, this.allowDiagonal, heuristic);
			for (i = 0, l = neighbors.length; i < l; i++) {
				n = neighbors[i];

				if (!n.walkable) {
					continue;
				}

				costSoFar = current._calcCost + grid.distance(current, n);

				// check if the neighbor has not been inspected yet, or can be reached with smaller cost from the current node
				if (!n._visited || costSoFar < n._calcCost) {
					n._visited = true;
					n._parent = current;
					n._calcCost = costSoFar;
					// console.log(n);
					// _priority is the most important property, since it makes the algorithm "greedy" and seek the goal.
					// otherwise it behaves like a brushfire/breadth-first
					n._priority = costSoFar + grid.distance(endNode, n);

					// check neighbor if it's the end current as well--often cuts steps by a significant amount
					if (n === endNode) {
						return PathUtil.backtrace(endNode);
					}
					// console.log(n);
					this.list.add(n);
				}
				// console.log(this.list);
			} // end for each neighbor
		} // end while not open list empty
		// failed to find the path
		return null;
	}

	compare(nodeA: Cell, nodeB: Cell): number {
		return nodeA._priority - nodeB._priority;
	}
}