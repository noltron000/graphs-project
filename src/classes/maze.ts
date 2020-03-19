import Cell from './cell'
import Adjacents from './adjacents'

class Maze {
	compass:Adjacents
	dimensions:Array<number>
	map:Array<Cell|undefined|null>
	constructor (
		compass:Adjacents,
		...dimensions:Array<number>
	) {
		// compass lets us know north/south/east/west.
		this.compass = compass
		this.dimensions = dimensions
		this.map = new Array(this.size)
	}

	get size ():number {
		/*
		returns the full size of the maze.
		*/
		if (this.dimensions.length === 0) {
			return 0
		} else {
			return this.dimensions.reduce((a, b) => a * b)
		}
	}

	validNeighbors (
		index1:number,
		index2:number,
	):boolean {
		/*
		helper function.
		removes neighbors that are invalid in some way,
		such as being out of bounds or across the map.
		*/
		// calculate neighbors row and column position.
		const column1:number = index1 % this.length
		const column2:number = index2 % this.length
		const row1:number = Math.floor(index1 / this.length)
		const row2:number = Math.floor(index2 / this.length)
		let pass1:boolean = false
		let pass2:boolean = false

		const neighbors1:{[key:string]:number} = {
			'north': index1 - this.length,
			'south': index1 + this.length,
			'east': index1 + 1,
			'west': index1 - 1,
		}

		const neighbors2:{[key:string]:number} = {
			'north': index2 - this.length,
			'south': index2 + this.length,
			'east': index2 + 1,
			'west': index2 - 1,
		}

		if (
			// the neighbors must share a row or a column.
			// otherwise it isn't really a neighbor, is it?
			(row1 === row2 || column1 === column2)
			// ensure both positions land within the grid.
			&& (0 <= index1 && index1 < this.size)
			&& (0 <= index2 && index2 < this.size)
		) {
			// its a neighbor!
		} else {
			// not a neighbor.
			return false
		}

		for (let neighbor of Object.values(neighbors1)) {
			if (neighbor === index2) {
				pass1 = true
				break
			}
		}

		for (let neighbor of Object.values(neighbors2)) {
			if (neighbor === index1) {
				pass2 = true
				break
			}
		}

		if (pass1 && pass2) {
			return true
		} else {
			return false
		}
	}

	generate (
		rootIndex:number
	) {
		/*******************************************************
		generates a perfect maze.
		its done recursively via a depth-first traversal tree.
		this is a setter function; it does not return anything.
		---
		compass = cardinal direction
		reverse = reversed cardinal direction
		root_pos = root position
		neighbor = neighbor position
		*******************************************************/
		/*
		// == TODO ==
		// This code should be placed elsewhere...
		if (rootIndex === undefined) {
			// Generation starts at a random point in the maze;
			// rootIndex doesn't infer a start/exit.
			// In the finished maze, one can always find a path
			// from any point A to B; that can be decided later.
			rootIndex = Math.random() * (this.size - 1)
			// note our visited list exists as the maze property.
		}
		*/

		// first, fill the maze spot with an empty cell.
		const CurrentCell:Cell = new Cell()
		this.maze[rootIndex] = CurrentCell

		// grab the position id from each cardinal direction.
		const neighboringIndices:{[key:string]:number} = {
			'north': rootIndex - this.length,
			'south': rootIndex + this.length,
			'east': rootIndex + 1,
			'west': rootIndex - 1,
		}

		// this is useful for doubly-linking vertices.
		const reversedCompass:{[key:string]:string} = {
			'north': 'south',
			'south': 'north',
			'east': 'west',
			'west': 'east',
		}

		// randomize compass order.
		const randomCompass:Array<string> = shuffle(Object.keys(neighboringIndices))

		randomCompass.forEach((direction:string):void => {
			// gets the index of the neighbor via direction.
			const neighbor:number = neighboringIndices[direction]
			// reversal reverses direction, a cardinal direction.
			const reversal:string = reversedCompass[direction]

			// if validating the neighbor fails, then the
			// neighbor is a maze boundary.
			if (this.validNeighbors(rootIndex, neighbor)) {
				// null represents such a boundary.
				CurrentCell['neighbors'][direction] = null
			// if the neighbor is valid, then the neighbor exists.
			} else {
				// neighbor is valid, representing a spot in maze.
				if (this.maze[neighbor] === undefined) {
					// this spot is empty! fill it up!
					// generate a new maze block.
					const NeighborCell:Cell = this.generate(neighbor)

					// link up the net / graph / tree.
					CurrentCell['neighbors'][direction] = NeighborCell
					NeighborCell['neighbors'][reversal] = CurrentCell
				}
			}
		})

		// this current cell is used in the stack upstream.
		// if this is the root cell, the returned item
		// simply might not be caught by anything.
		return CurrentCell
	}
}

/*
	def shortest_path_bfs(self, paths=None, A=None, B=None):
		'''
		A = given starting node
		B = given finishing node
		C = arbitrary iterated node
		a_list = traversed list of nodes
		b_list = traversed list of nodes
		c_list = traversed list of nodes
		queue:
		visited: set of visited vertices
		vertices: every single vertex in the graph
		'''
		# set up default parameters.
		if A is None or B is None:
			# a_loc = random.randint(0, 0)
			# b_loc = random.randint(0, len(self.maze) - 1)
			a_loc = 0
			b_loc = len(self.maze) - 1
			print('find', b_loc)
			A = self.maze[a_loc]
			B = self.maze[b_loc]
		# create vertex queue, and start with vertex A.
		queue = [[A]]  # HACK not a real queue.
		# create visited set, and start with vertex A.
		visited = {A}

		while queue != []:
			# dequeue first vertex.
			# HACK change later for non-array.
			a_list = queue.pop()
			A = a_list[-1]
			# check a condition.
			if A == B:
				print(len(a_list), 'steps')
				return a_list
			# add its neighbors to the queue.
			for compass in A.neighbors:
				# get vertex from compass.
				C = A.neighbors[compass]
				# pass if neighbor does not exist.
				if C is None or C is False:
					pass
				# pass if neighbor has been visited already.
				elif C in visited:
					pass
				else:
					# visit the vertex.
					visited.add(C)
					# HACK change later for non-array.
					c_list = a_list[:]
					c_list.append(C)
					queue.insert(0, c_list)
		return paths

	def aerate_maze(self, n=1):
		'''
		deletes n random walls to destroy trees.
		this could make a maze easier or harder.
		'''
		# this will allow us to iterate through blocks.
		# we want to find a block with a blocked neighbor.
		unvisited = list(range(0, len(self.maze)))
		random.shuffle(unvisited)

		# loop through until its found
		block_id = None
		block = None
		found = False
		while not found:
			# pick out a random block.
			block_id = unvisited.pop()
			block = self.maze[block_id]
			# check its neighbors.
			for compass in block.neighbors:
				neighbor = block.neighbors[compass]
				# see if it has a blocked off neighbor.
				if block.neighbors[compass] is False:
					found = True

		# randomize compass order.
		random_neighbors = list(block.neighbors.items())
		random.shuffle(random_neighbors)

		# neighbors
		sibling_id = None
		sibling = None

		# check its compass neighbors.
		for compass, neighbor in random_neighbors:
			if neighbor is False:
				if compass == 'north':
					sibling_id = block_id - self.length
				elif compass == 'south':
					sibling_id = block_id + self.length
				elif compass == 'east':
					sibling_id = block_id + 1
				elif compass == 'west':
					sibling_id = block_id - 1
				sibling = self.maze[sibling_id]
				break

		# this is useful for doubly-linked vertices.
		reverse_compass = {
			'north': 'south',
			'south': 'north',
			'east': 'west',
			'west': 'east',
		}

		# reverse reverses compass, a cardinal direction.
		reverse = reverse_compass[compass]

		# finally set the new connection!
		block.neighbors[compass] = sibling
		sibling.neighbors[reverse] = block

		# keep going if n is more than 1.
		n -= 1
		if n > 0:
			self.aerate_maze(n)
*/


export default Maze

/***********************************************************
This section describes footnotes & comments for the project.
These should mostly contain bugs and todo items.

== TODO ==
Maze array should have a fixed size:
size = maze length × maze height

== TODO ==
Maze class only supports 2D-Square mazes.
Add support for ND-polyhedral mazes.

== TODO ==
Maze class only supports breadth-first traversal.
Add support for other maze-generation algorithms.

***********************************************************/
