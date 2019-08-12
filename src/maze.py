# python packages
import random
# internal packages
from block import Block
from unicode_graphic import UnicodeGraphic


class Maze():
	def __init__(self, length=None, height=None):
		'''
		initialization will run maze generation.
		maze generation can use one of several algorithms;
		each one creates a stylistically different result.
		'''
		# check if length and height exist yet.
		if not length or not height:
			length = int(input('how many blocks wide maze?\t'))
			height = int(input('how tall will the maze be?\t'))
		# initialize maze parameters.
		self.length = length
		self.height = height
		# initialize maze via a list with a number of slots.
		self.maze = [None] * length * height

		# fill in maze array with pointers to maze blocks.
		# blocks reference their neighbors, creating a graph.
		self.generate_maze()

	def __repr__(self, type='p'):
		'''
		string representation pulls from UnicodeGraphic.
		this function is accessed when print is ran on a maze.
		'''
		# get graphics from graphics object.
		graphic = UnicodeGraphic(self)
		# select proper graphic technique here.
		if type == 'p':
			return graphic.pipe_maze()
		if type == 'e':
			return graphic.edge_maze()

	def get_block(self, row, column):
		'''
		returns the cell located at given coordinates.
		'''
		position = row * self.height + column
		block = self.maze[position]
		return block

	def get_row(self, row):
		'''
		returns the nth full row.
		'''
		east = row * self.height
		west = east + self.length
		row = self.maze[east:west]
		return row

	def get_column(self, column):
		'''
		returns the nth full column.
		'''
		num_columns = self.length
		column = self.maze[column::num_columns]
		return column

	def get_every_row(self):
		'''
		returns an array arrays; a list of every row.
		'''
		every_row = []
		for row in range(0, self.height):
			every_row.append(self.get_row(row))
		return every_row
 
	def get_every_column(self):
		'''
		returns an array arrays; a list of every column.
		'''
		every_column = []
		for column in range(0, self.length):
			every_column.append(self.get_column(column))
		return every_column

	def generate_maze(self, root_pos=None):
		'''
		generates a perfect maze.
		its done recursively via a depth-first traversal tree.
		this is a setter function; it does not return anything.
		---
		compass = cardinal direction
		reverse = reversed cardinal direction
		root_pos = root position
		neighbor = neighbor position
		'''
		if root_pos is None:
			# root_pos starts at a random point in the maze.
			# this doesnt infer a start/exit in the finished maze.
			# one can always find a path from any point A to B;
			# the program will decide these points later.
			root_pos = random.randint(0, len(self.maze) - 1)
			# note our visited list exists as the maze property.

		# first, fill the maze spot with an empty block.
		self.maze[root_pos] = Block(root_pos)

		# grab the position id from each cardinal direction.
		root_neighbors = {
			'north': root_pos - self.length,
			'south': root_pos + self.length,
			'east': root_pos + 1,
			'west': root_pos - 1,
		}

		# this is useful for doubly-linked vertices.
		reverse_compass = {
			'north': 'south',
			'south': 'north',
			'east': 'west',
			'west': 'east',
		}

		# this row and column will help validate neighbors.
		root_pos_column = root_pos % self.length
		root_pos_row = root_pos // self.length

		def validate(neighbor):
			'''
			helper function.
			removes neighbors that are invalid in some way,
			such as being out of bounds or across the map.
			'''
			# calculate neighbors row and column position.
			neighbor_column = neighbor % self.length
			neighbor_row = neighbor // self.length

			# ensure neighbor's position lands within the grid.
			if len(self.maze) > neighbor >= 0:

				# the neighbor must share atleast a row or a column;
				# otherwise it isnt really a neighbor, is it.
				if (root_pos_row == neighbor_row
						or root_pos_column == neighbor_column):
					return neighbor

			# not a neighbor.
			return None

		# update neighbors with validate.
		for compass, neighbor in root_neighbors.items():
			# it is safe to update a compass's value in this loop;
			# it isnt safe to update a compass in this loop.
			root_neighbors[compass] = validate(neighbor)

		# randomize compass order
		random_neighbors = list(root_neighbors.items())
		random.shuffle(random_neighbors)

		for compass, neighbor in random_neighbors:
			# reverse reverses compass, a cardinal direction.
			reverse = reverse_compass[compass]
			# neighbor is empty, representing a maze boundary.
			if neighbor is None:
				self.maze[root_pos].neighbors[compass] = None

			# neighbor is an int, representing a spot in maze.
			else:
				# this spot is empty! fill it up!
				if self.maze[neighbor] is None:
					# generate a new maze block.
					self.generate_maze(neighbor)
					# link up the net / graph / tree.
					this_block = self.maze[root_pos]
					that_block = self.maze[neighbor]
					this_block.neighbors[compass] = that_block
					that_block.neighbors[reverse] = this_block

				# this spot is filled.
				else:
					pass

	def solve_maze(self, start=None, finish=None):
		# check for default parameters
		if start == None:
			start = self.maze[0]
		if finish == None:
			finish = self.maze[len(self.maze) - 1]

		# visited list
		visited = []
		# HACK: used an array over an actual queue.
		# this makes it a bit slower than it should actually be.
		queue = [start]

		while queue != []:
			# dequeue block at front of queue
			block = queue.pop()
			# visit this block's data with given function
			visited.append(block)
			# if found, the array is actually the path to finish.
			if block == finish:
				return visited
			# enqueue this block's neighbors, if they are filled.
			for compass in block.neighbors:
				neighbor = block.neighbors[compass]
				# pass if visited
				if neighbor in visited:
					pass
				# check if in
				elif (neighbor is not None
				and neighbor is not False):
					queue.append(neighbor)
				# pass if nothing
				else:
					pass
		else:
			return None

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
		direction = None

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
