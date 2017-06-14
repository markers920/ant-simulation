
var foodImages = ['apple.png']	//, 'PicnicBasket.png', 'sandwich.png']

class FoodSource {
		
	constructor(svg, id) {
		this.id = id
		
		//NOTE: squares make movement in both dimensions look like the same speed
		this.max_width = svg.getBoundingClientRect().width
		this.max_height = svg.getBoundingClientRect().height
		this.max_width = Math.min(this.max_width, this.max_height)
		this.max_height = Math.min(this.max_width, this.max_height)
		
		this.position = getRandomVector(0.0, 1.0)
		
		this.foodRemaining = 10	//randomRange(8,15)
		
		this.position = getRandomVector(0.0, 1.0)
		
		this.cx = bound(this.position.get('x') * this.max_width, BUFFER_SIZE, this.max_width-BUFFER_SIZE)
		this.cy = bound(this.position.get('y') * this.max_height, BUFFER_SIZE, this.max_height-BUFFER_SIZE)
		
		//circle
		/*this.shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); //Create a path in SVG's namespace
		this.shape.setAttribute('r', this.radius())
		this.shape.setAttribute('stroke', 'black')
		this.shape.setAttribute('stroke-width', '0')
		this.shape.setAttribute('fill', '#207228')
		this.shape.setAttribute('cx', cx)
		this.shape.setAttribute('cy', cy)
		svg.appendChild(this.shape)*/
		
		//image
		this.shape = document.createElementNS('http://www.w3.org/2000/svg','image')
		this.shape.setAttributeNS(null,'x', this.cx-this.radius())
		this.shape.setAttributeNS(null,'y', this.cy-this.radius())
		this.shape.setAttributeNS(null,'height', 2*this.radius())
		this.shape.setAttributeNS(null,'width', 2*this.radius())
		
		var imgFile = foodImages[Math.floor(random()*foodImages.length)]
		//this.shape.setAttributeNS('http://www.w3.org/1999/xlink','href', 'apple.png')
		this.shape.setAttributeNS('http://www.w3.org/1999/xlink','href', imgFile)
		
		this.shape.setAttributeNS(null, 'visibility', 'visible')
		svg.appendChild(this.shape)
	}
	
	radius() {
		return this.foodRemaining
	}
	
	eat(amount) {
		this.foodRemaining = Math.max(this.foodRemaining-amount, 0.0)
		
		//circle
		//this.shape.setAttribute('r', this.radius())
		
		//image
		this.shape.setAttributeNS(null,'x', this.cx-this.radius())
		this.shape.setAttributeNS(null,'y', this.cy-this.radius())
		this.shape.setAttributeNS(null,'height', 2*this.radius())
		this.shape.setAttributeNS(null,'width', 2*this.radius())
	}
	
	
	//update() {
	//	
	//}
}
