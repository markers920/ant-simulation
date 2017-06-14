
var LOOP_DELAY = 10		//milliseconds
var MAXIMUM_NUMBER_ACTIVE_FOOD_SOURCES = 10
var MAXIMUM_SHOWN_COMMUNICATION_OBJECTS = 10

class Swarm {
	constructor(svg, numberOfAgents) {
		//NOTE: squares (not rects) make movement in both dimensions look like the same speed
		this.max_width = svg.getBoundingClientRect().width
		this.max_height = svg.getBoundingClientRect().height
		this.max_width = Math.min(this.max_width, this.max_height)
		this.max_height = Math.min(this.max_width, this.max_height)
		
		//set up comms line svg objects
		this.communicationLines = []
		for(var idx = 0; idx < MAXIMUM_SHOWN_COMMUNICATION_OBJECTS; idx++) {
			var aLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			aLine.setAttribute('x1', 0)
			aLine.setAttribute('y1', 0)
			aLine.setAttribute('x2', 100)
			aLine.setAttribute('y2', 100)
			aLine.setAttribute('stroke', '#DDDDDD')
			aLine.setAttribute('stroke-width', 3)
			aLine.setAttribute('visibility', 'hidden')
			svg.appendChild(aLine)
			this.communicationLines.push(aLine)
		}
		
		//create new agents
		this.agents = []
		for(var agentIndex = 0; agentIndex < numberOfAgents; agentIndex++) {
			this.agents.push(new Agent(svg, agentIndex))
		}
		
		this.foodSources = []
		this.totalFoodSourcesAdded = 0
		this.loopIndex = 0
	}
	
	update() {
		this.loopIndex++
		//console.log('swarm update:' + this.loopIndex)
		
		this.communicatingPairs = new Set()
		
		//update swarm members
		var thisSwarm = this
		this.agents.forEach(function(a) {
			a.update(thisSwarm, thisSwarm.foodSources, thisSwarm.agents)
		})
		
		//draw communication objects
		this.communicationLines.forEach(function(aLine) {	//hide all of them
			aLine.setAttribute('visibility', 'hidden')
		})
		
		var lineIdx = 0
		this.communicatingPairs.forEach(function(pair) {
			//console.log('communicatingPair:' + pair['id1'] + ',' + pair['id2'])
			if(lineIdx < MAXIMUM_SHOWN_COMMUNICATION_OBJECTS) {
				var a1 = thisSwarm.agents[pair['id1']]
				var a2 = thisSwarm.agents[pair['id2']]
				
				var aLine = thisSwarm.communicationLines[lineIdx]
				aLine.setAttribute('x1', a1.getPixelPosition()['cx'])
				aLine.setAttribute('y1', a1.getPixelPosition()['cy'])
				aLine.setAttribute('x2', a2.getPixelPosition()['cx'])
				aLine.setAttribute('y2', a2.getPixelPosition()['cy'])
				aLine.setAttribute('visibility', 'visible')
				lineIdx = lineIdx + 1
			}
		})
		
		//update food sources
		var nextGenerationFood = []
		this.foodSources.forEach(function(foodSource) {
			if(foodSource.foodRemaining > 0) {
				nextGenerationFood.push(foodSource)
			}
		})
		this.foodSources = []
		nextGenerationFood.forEach(function(foodSource) {
			thisSwarm.foodSources.push(foodSource)
		})
		
		
		//add new food sources
		if(this.foodSources.length < MAXIMUM_NUMBER_ACTIVE_FOOD_SOURCES && random() < 0.1) {
			this.addFood()
		}
	}

	run() {
		var thisSwarm = this
		setInterval(function(){
			thisSwarm.update()
		}, LOOP_DELAY)
	}
	
	addFood() {
		//console.log('totalFoodSourcesAdded:' + this.totalFoodSourcesAdded)
		this.foodSources.push(new FoodSource(svg, this.totalFoodSourcesAdded))
		this.totalFoodSourcesAdded = this.totalFoodSourcesAdded + 1
	}
}
