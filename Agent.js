
var AGENT_DEFAULT_SIZE = 5
var POSITION_HISTORY_LENGTH = 10
//var FOOD_EATEN_PER_CYCLE = 0.05
//var FOOD_DELIVERED_PER_CYCLE = 0.1
//var MAXIMUM_FOOD_LEVEL = 1
var MAXIMUM_COMMUNICATION_DISTANCE = 15

var HOME = new Map([
	['x', 0.0],
	['y', 0.0]])
	

//the auto regressive coefficients used for the 'random' walk components
var AUTO_REGRESSIVE_COEFFICIENTS = new Map([
		[0, 1],				//when this is used... zero is the prev movement
		[1, 1], 
		[2, 1], 
		[3, 1], 
		[4, 0], 
		[5, 0], 
		[6, 0]
	])
//valuesSumToOne(AUTO_REGRESSIVE_COEFFICIENTS)

//the moving average coefficients used for the 'random' walk components
var macArray = []
for(idx = 0; idx < 100; idx++) {
	macArray.push([idx, 1])
}
var MOVING_AVERAGE_COEFFICIENTS = new Map(macArray)
valuesSumToOne(MOVING_AVERAGE_COEFFICIENTS)



class Agent {
		
	constructor(svg, id) {
		this.foodEatenPerCycle = randomRange(0.03, 0.06)
		this.foodDeliveredPerCycle = randomRange(0.80, 0.12)
		this.maximumFoodLevel = 1.0
		this.speed = randomRange(0.0009, 0.0011)
		
		//NOTE: squares (not rects) make movement in both dimensions look like the same speed
		this.max_width = svg.getBoundingClientRect().width
		this.max_height = svg.getBoundingClientRect().height
		this.max_width = Math.min(this.max_width, this.max_height)
		this.max_height = Math.min(this.max_width, this.max_height)
		
		this.id = id
		this.position = getRandomVector(0.0, 1.0)
		this.foodLevel = 0
		
		this.knownFoodSources = new Map()
		this.radius = AGENT_DEFAULT_SIZE
		this.color = getRandomColor()
		
		this.colorScale = d3.scaleLinear()
			.domain([0.0, this.maximumFoodLevel])
			.range(['#FFFFFF', this.color])
		
		//circles
		this.shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); //Create a path in SVG's namespace
		this.shape.setAttribute('r', this.radius)
		this.shape.setAttribute('stroke', this.color)
		this.shape.setAttribute('stroke-width', '1')
		this.setPosition()
		svg.appendChild(this.shape)
		
		
		//create the historic random movement vectors ... the random iid vectors
		this.historicRandomVectors = []
		
		//create the historic movement vectors ... how this agent has moved
		this.historicMovements = []
		
		//historical positions ... where this agent has been
		this.historicPosition = []
	}
	
	
	
	updateHistoricRandomVectors(forcedVector) {
		var randomUnitVector = null
		if(forcedVector == null) {
			randomUnitVector = getRandomUnitVector()
		} else {
			randomUnitVector = new Map(forcedVector)
		}
				
		//update
		this.historicRandomVectors.unshift(randomUnitVector)
		this.historicRandomVectors.splice(MOVING_AVERAGE_COEFFICIENTS.size)
	}
	
	//still does the normalization and speed for the forced options
	//may want to have it move UP TO the border of the food source
	updateHistoricMovements(forcedVector) {
		var newMovement = null
		if(forcedVector == null) {
			newMovement = new Map([
				['x', 0.0],
				['y', 0.0]])
			
			//ARMA model here
			var thisAgent = this
			Array.from(MOVING_AVERAGE_COEFFICIENTS.keys()).forEach(function(key) {	//moving average
				if(thisAgent.historicRandomVectors.length > key) {
					var coefficient = MOVING_AVERAGE_COEFFICIENTS.get(key)
					var historicVector = thisAgent.historicRandomVectors[key]
					newMovement.set('x', newMovement.get('x') + coefficient*historicVector.get('x'))
					newMovement.set('y', newMovement.get('y') + coefficient*historicVector.get('y'))
				}
			})
			
			Array.from(AUTO_REGRESSIVE_COEFFICIENTS.keys()).forEach(function(key) {	//auto regressive
				if(thisAgent.historicMovements.length > key) {
					var coefficient = AUTO_REGRESSIVE_COEFFICIENTS.get(key)
					var historicVector = thisAgent.historicMovements[key]
					newMovement.set('x', newMovement.get('x') + coefficient*historicVector.get('x'))
					newMovement.set('y', newMovement.get('y') + coefficient*historicVector.get('y'))
				}
			})
			
			normalizeMap(newMovement)
			newMovement.set('x', newMovement.get('x')*this.speed)
			newMovement.set('y', newMovement.get('y')*this.speed)
		} else {
			newMovement = new Map(forcedVector)
		}
		
		this.historicMovements.unshift(newMovement)
		this.historicMovements.splice(AUTO_REGRESSIVE_COEFFICIENTS.size)
	}
	
	updateHistoricPosition() {
		var thisMovement = this.historicMovements[0]
		this.position.set('x', bound(this.position.get('x') + thisMovement.get('x'), 0.0, 1.0))
		this.position.set('y', bound(this.position.get('y') + thisMovement.get('y'), 0.0, 1.0))
		
		this.historicPosition.unshift(new Map(this.position))
		this.historicPosition.splice(POSITION_HISTORY_LENGTH)
	}
	
	getPixelPosition() {
		var newCx = bound(this.position.get('x') * this.max_width, BUFFER_SIZE, this.max_width-BUFFER_SIZE)
		var newCy = bound(this.position.get('y') * this.max_height, BUFFER_SIZE, this.max_height-BUFFER_SIZE)
		return {'cx': newCx, 'cy': newCy}
	}
	
	setPosition() {
		var p = this.getPixelPosition()
		this.shape.setAttribute('cx', p['cx'])
		this.shape.setAttribute('cy', p['cy'])
	}
	
	
	eat(foodSource) {
		//console.log('agent:' + this.id + ' eating foodSource:' + foodSource.id)
		var amountToEat = Math.min(foodSource.foodRemaining, this.foodEatenPerCycle)
		foodSource.eat(amountToEat)
		this.foodLevel += amountToEat
		this.foodLevel = Math.min(this.foodLevel, this.maximumFoodLevel)
	}
	
	deliverFood() {
		var amountToDeliver = Math.min(this.foodLevel, this.foodDeliveredPerCycle)
		this.foodLevel -= amountToDeliver
		this.foodLevel = Math.max(this.foodLevel, 0.0)
	}
	
	agentFull() {
		return this.foodLevel >= this.maximumFoodLevel
	}
	
	updateKnownFoodSourcesFromFoodSources(foodSources) {
		var thisAgent = this
		foodSources.forEach(function(foodSource) {
			var foodRadius = foodSource.radius()
			var ddd = vectorDistance(foodSource.position, thisAgent.position)*thisAgent.max_width
			if(ddd < foodRadius) {	//within range
				if(foodSource.foodRemaining > 0) {
					thisAgent.knownFoodSources.set(
						foodSource.id, 
						new Map([
							['believedFoodRemaining', foodSource.foodRemaining + 0],	//+0 to force a new value... i dont know about references for primitives
							['foodSource', foodSource]
						])
					)
					//console.log('update food source:' + foodSource.id + ' @ ' + foodSource.foodRemaining + ' ~ ' + thisAgent.knownFoodSources.get(foodSource.id).get('believedFoodRemaining'))
				}
			}
		})
	}
	
	updateKnownFoodSourcesFromPeer(swarmObject, peers) {
		var thisAgent = this
		peers.forEach(function(peer) {
			if(peer.id != thisAgent.id) {
				var ddd = vectorDistance(peer.position, thisAgent.position)*thisAgent.max_width
				if(ddd <= peer.radius + thisAgent.radius + MAXIMUM_COMMUNICATION_DISTANCE) {	//within range
					//console.log('agent meeting:(' + thisAgent.id + ' ' + peer.id + ') ~ ' + ddd)
					var pair = {
						'id1':Math.min(thisAgent.id, peer.id), 
						'id2': Math.max(thisAgent.id, peer.id)}
					swarmObject.communicatingPairs.add(pair)
					
					//TODO: this should prob treat knownFoodSources as a map...
					//peer.knownFoodSources.forEach(function(kfs) {		//note kfs is not like the other vectors, but it does have an x and y
					//	
					//})
					for(const entry of peer.knownFoodSources.entries()) {
						var foodId = entry[0]
						var entryValue = entry[1]
						
						//TODO: if this food source hasn't been 'forgotton' ... 
						//as in if this agent knew about it, but forgot it b/c it isnt there anymore
						
						//new information
						if(!thisAgent.knownFoodSources.has(foodId)) {
							thisAgent.knownFoodSources.set(foodId, new Map(peer.knownFoodSources.get(foodId)))
						} 
						
						else {
							var peerBelief = peer.knownFoodSources.get(foodId).get('believedFoodRemaining')
							var selfBelief = thisAgent.knownFoodSources.get(foodId).get('believedFoodRemaining')
							
							//less food than thought... something has changed
							if(peerBelief < selfBelief) {
								thisAgent.knownFoodSources.set(foodId, new Map(peer.knownFoodSources.get(foodId)))
							}
						}
					}
				}
			}
		})
	}
	
	
	update(swarmObject, foodSources, peers) {
		var thisAgent = this
		
		var movementElement = new Map([
			['x', HOME.get('x')-thisAgent.position.get('x')],
			['y', HOME.get('y')-thisAgent.position.get('y')]])
		var distanceFromHome = vectorLength(movementElement)
		
		this.updateKnownFoodSourcesFromFoodSources(foodSources)
		this.updateKnownFoodSourcesFromPeer(swarmObject, peers)
		
		//deliver food home
		if(this.foodLevel > 0 && distanceFromHome == 0) {
			//console.log('agent:' + thisAgent.id + ' doing delivery')
			this.deliverFood()
		}
		
		//else if full, return home
		else if(this.agentFull()) {
			//console.log('agent:' + thisAgent.id + ' full, run deliver')
			//console.log('i am stuffed! ' + this.id)
			var randomMovementElement = new Map([	//no random element... we're heading home!
				['x', 0.0],
				['y', 0.0]])
				
			var movementElement = new Map([
				['x', HOME.get('x')-thisAgent.position.get('x')],
				['y', HOME.get('y')-thisAgent.position.get('y')]])
				
			normalizeMap(movementElement)
			movementElement.set('x', movementElement.get('x')*this.speed)
			movementElement.set('y', movementElement.get('y')*this.speed)
				
			thisAgent.updateHistoricRandomVectors(randomMovementElement)	//add a new random vector
			thisAgent.updateHistoricMovements(movementElement)				//calculate the new movement
			thisAgent.updateHistoricPosition()								//update the position
		}
		
		else {
			//check the food sources to see if one is near enough to eat
			var closestFoodSource = null
			var closestFoodSourceDistance = 10000	//TODO: set to double max
			var closestFoodSourceIdKey = -1
			//this.knownFoodSources.entries().forEach(function(entry) {	//note kfs is not like the other vectors, but it does have an x and y
			for(const entry of this.knownFoodSources.entries()) {
				var foodId = entry[0]
				var entryValue = entry[1]
				var ddd = vectorDistance(entryValue.get('foodSource').position, thisAgent.position)
				if(ddd < closestFoodSourceDistance) {
					closestFoodSourceIdKey = foodId
					closestFoodSource = new Map(entryValue)
					closestFoodSourceDistance = ddd
				}
			}
			
			var agentEating = false
			if(closestFoodSource != null) {	//there is a known (believed) food source
				var ddd = vectorDistance(closestFoodSource.get('foodSource').position, thisAgent.position)*thisAgent.max_width
				if(ddd < closestFoodSource.get('foodSource').radius()) {	// && closestFoodSource.foodRemaining > 0.0) {	//within food range
					agentEating = true
					this.eat(closestFoodSource.get('foodSource'))
				}
				//console.log('agent:' + thisAgent.id + ' not full - KNOWN FOOD - eating:' + agentEating + ' ~~~ ' + closestFoodSource.get('believedFoodRemaining') + ' ~~~ ' + closestFoodSource.get('foodSource').foodRemaining)
				
				//move toward it, regardless
				var randomMovementElement = new Map([	//no random element... we're eating!
					['x', 0.0],
					['y', 0.0]])
					
				var movementElement = new Map([
					['x', closestFoodSource.get('foodSource').position.get('x')-thisAgent.position.get('x')],
					['y', closestFoodSource.get('foodSource').position.get('y')-thisAgent.position.get('y')]])
				var movementLength = vectorLength(movementElement)
					
				if(movementLength > this.speed) {
					normalizeMap(movementElement)
					movementElement.set('x', movementElement.get('x')*this.speed)
					movementElement.set('y', movementElement.get('y')*this.speed)
				}
					
				thisAgent.updateHistoricRandomVectors(randomMovementElement)		//add a new random vector
				thisAgent.updateHistoricMovements(movementElement)			//calculate the new movement
				thisAgent.updateHistoricPosition()				//update the position
				
				if(!agentEating && movementLength == 0) {
					//console.log('food is gone')
					//this.knownFoodSources.splice(closestFoodSourceIndex, 1)	//remove this food sorce from agent's memory
					this.knownFoodSources.delete(closestFoodSourceIdKey)
				}
			}
		
			//wandering around mode
			else {
				//console.log('agent:' + thisAgent.id + ' not full - WANDER')
				this.updateHistoricRandomVectors(null)		//add a new random vector
				this.updateHistoricMovements(null)			//calculate the new movement
				this.updateHistoricPosition()				//update the position
			}
		}
		
		this.setPosition()
		this.shape.setAttribute('fill', this.colorScale(this.foodLevel))
	}
}
