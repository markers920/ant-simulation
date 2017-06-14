

var RNG_SEED = 1
var BUFFER_SIZE = 5



function random() {
	var x = Math.sin(RNG_SEED++) * 10000;
	return x - Math.floor(x);
}

function randomRange(minValue, maxValue) {
	var range = maxValue-minValue
	return range*random()+minValue
}

function getRandomVector(minValue, maxValue) {
	var range = maxValue-minValue
	var rv = new Map([
		['x', randomRange(minValue, maxValue)],
		['y', randomRange(minValue, maxValue)]])
	return rv
}

function getRandomUnitVector() {
	var rv = getRandomVector(-1.0, +1.0)
	normalizeMap(rv)
	return rv
}

//normalize if this isn't the zero vector
function normalizeMap(m) {
	var mValues = Array.from(m.values())
	var length = 0.0
	mValues.forEach(function(v) {
		length += v*v
	})
	length = Math.sqrt(length)

	if(length > 0) {
		Array.from(m.keys()).forEach(function(key) {
			m.set(key, m.get(key) / length)
		})
	}
}

function valuesSumToOne(m) {
	var mValues = Array.from(m.values())
	var sum = mValues.reduce(function (a, b) {
		return a + b;
	}, 0);
	
	Array.from(m.keys()).forEach(function(key) {
	m.set(key, m.get(key) / sum)
	})
}

function bound(v, min, max) {
	return Math.max(Math.min(v, max), min)
}

function vectorLength(v) {
	return Math.pow(Math.pow(v.get('x'), 2.0) + Math.pow(v.get('y'), 2.0), 0.5)
}

function vectorDistance(v1, v2) {
	var v = new Map([
		['x', v1.get('x')-v2.get('x')],
		['y', v1.get('y')-v2.get('y')]])
	return vectorLength(v)
}

function scalarVectorMultiply(s, v) {
	var v2 = new Map([
		['x', s*v.get('x')],
		['y', s*v.get('y')]])
	return v2
}


function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.floor(random() * 16)];
	}
	return color;
}