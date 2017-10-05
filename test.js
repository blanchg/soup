// let platform = require('platform');
let math = require('mathjs');
math.config({number:'BigNumber', precision: 128});
let fs = require('fs');
let primes = require('./primes.json');
let n = 4;
if (process.argv.length > 2) {
	n = parseInt(process.argv[2]);
}
let edges = (n * (n - 1)) / 2;
let config = {
	n,
	edges,
	targetEnergy: calcEnergy(n, edges),
	primes: primes.slice(0, edges),
}

let options = {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,

};
let df = new Intl.DateTimeFormat('en-AU', options);
let format = df.format;

let pointNames = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B'];

let graph = buildGraph(config);
scoreGraph(graph);
console.log(graph.sum + ' ' + graph.score + ' ' + logGraph(graph));
logNodes(graph);
// improve(graph);
console.log("After improve");
let best = clone(graph);
let temp = 1;
while (temp > 0.0000001) {
	temp = temp * 0.99999999;
	mutateGraph(graph);
	scoreGraph(graph);
	if (P(best.score, graph.score, temp) >= Math.random()) {
		if (math.smaller(graph.score, best.score)) {
			console.log(format(new Date()) + " " + n + '*\n' + math.number(graph.score) + '\n' + logGraph(graph));
			logNodes(graph);
		}
		best = clone(graph);
	}
}

function improve(graph) {
	scoreGraph(graph);
	let bestGraphScore = graph.score;
	let found = false;
	let bestBar = graph.points[0];
 	for (var k = 1; k < graph.points.length; k++) {
 		let bar = graph.points[k];
 		if (math.smaller(bar.score, bestBar.score)) {
 			bestBar = bar;
 		}
 	}
	let numEdges = bestBar.edges.length;
	for (var l = 0; l < graph.points.length; l++) {
		let next = graph.points[l];
		if (next == bestBar) {
			continue;
		}
		for (var i = 0; i < numEdges; i++) {
			let lastEdge = bestBar.edges[i];
			for (var j = 0; j < numEdges; j++) {
				let temp = lastEdge.value;
				let nextEdge = next.edges[j];
				lastEdge.value = nextEdge.value;
				nextEdge.value = temp;
				scoreGraph(graph);
				let nextScore = graph.score;
				if (math.smaller(nextScore, bestGraphScore)) {
					found = true;
					// console.log(graph.points.length + '\n' + math.number(nextScore) + '\n' + logGraph(graph));
					// showScore(graph);
					bestGraphScore = nextScore;
					// console.log(JSON.stringify(graph));
					// return true;
				} else {
					nextEdge.value = lastEdge.value;
					lastEdge.value = temp;

				}
			}
		}
	}
 	return found;
}

function clone(graph) {
	let edges = graph.edges.map(e => {
		return {
			value: e.value,
			source: e.source,
			target: e.target
		}
	});
	let points = graph.points.map(p => {
		return {
			i: p.i,
			name: p.name,
			id: p.id,
			edges: []
		}
	});
	let pointDict = {};
	for (let i = 0; i < points.length; i++) {
		let point = points[i];
		pointDict[point.name] = point;
	}
	for (let i = 0; i < edges.length; i++) {
		let edge = edges[i];
		let source = pointDict[edge.source];
		let target = pointDict[edge.target];
		source.edges.push(edge);
		target.edges.push(edge);
	}
	return {
		points,
		edges,
		score: graph.score,
		targetEnergy: graph.targetEnergy,
		maxPrime: graph.maxPrime,
	};
}

function P(e, enext, temp) {
	if (math.smaller(enext, e)) {
		return 1;
	} else {
		return math.number(math.exp(math.divide(math.subtract(0, math.subtract(enext, e)), math.bignumber(temp) )));
	}
}
// console.log(graph.points[0]);

function calcEnergy(n, edges) {
	let sum = math.bignumber(1);
	for (var i = 0; i < edges; i++) {
		sum = math.multiply(sum, math.bignumber(primes[i]));
	}
	return math.ceil(math.multiply(math.pow(sum, math.bignumber(2/n)), n));
	//Math.ceil(n * Math.pow(sum, 2 / n));
}

function buildGraph(config) {
	let points = [];
	let edges = [];
	for (let i = 0; i < config.n; i++) {
		points.push({
			i,
			name: pointNames[i],
			id: pointNames[i],
			edges: [],
		});
	}

	let k = 0;

	for (let i = 0; i < config.n; i++) {

		let pointa = points[i];
		for (let j = i+1; j < config.n; j++) {
			let pointb = points[j];
			let edge = {
				// i: k,
				// name: pointa.name + '-' + pointb.name,
				value: config.primes[k],
				source: pointa.name,
				target: pointb.name,
			};
			k++;
			edges.push(edge);
			pointa.edges.push(edge);
			pointb.edges.push(edge);
		}

	}

	return {
		points,
		edges,
		targetEnergy: config.targetEnergy,
		maxPrime: config.primes[config.primes.length - 1],
	};
}

function scoreGraph(graph) {
	let sum = math.bignumber(0);
	let plength = graph.points.length;
	let elength = plength - 1;
	for (let i = 0; i < plength; i++) {
		let point = graph.points[i];
		point.score = math.bignumber(1);
		let edges = point.edges;
		for (let j = 0; j < elength; j++) {
			point.score = math.multiply(point.score, math.bignumber(edges[j].value));
		}
		sum = math.add(sum, point.score);
	}
	graph.sum = sum;
	graph.score = math.subtract(sum, graph.targetEnergy);
	return sum;
}

function sortGraph(graph) {
	let plength = graph.points.length;
	for (let i = 0; i < plength; i++) {
		let point = graph.points[i];
		point.edges.sort((a,b) => a.value - b.value);
	}
	graph.points.sort((a,b) => a.edges[0].value - b.edges[0].value);
}

function logGraph(graph) {
	let plength = graph.points.length;
	sortGraph(graph);
	let results = [];
	for (let i = 0; i < plength; i++) {
		let point = graph.points[i];
		// point.score = 1;
		results.push('{' +
			point.edges.map(e=>e.value).join(',') +
			'}');
	}
	return results.join(',');
}

function logNodes(graph) {
	let n = graph.points.length;
	let f = null;
	let f2 = null;
	try {
		f = fs.openSync('nodes' + n + '-' + math.format(graph.score) + '.json', 'w');
		f2 = fs.openSync('latest.json', 'w');
		let result = {
			result: logGraph(graph),
			maxPrime: graph.maxPrime,
			score: graph.score,
			nodes:graph.points.map(a => {
				return {id:a.id,group:a.i,score:a.score};
			}),
			links:graph.edges,
		};
		fs.writeSync(f, JSON.stringify(result));
		fs.writeSync(f2, JSON.stringify(result));
	} finally {
		if (f) {
			fs.closeSync(f);
		}
		if (f2) {
			fs.closeSync(f2);
		}
	}
}

function mutateGraph(graph) {
	// sort by point score
	// graph.points.sort((a,b) => math.number(math.subtract(a.score, b.score)));
	let n = graph.points.length;

	let first = graph.points[randomBetween(0, n-1)];
	let a = first.edges[random(n-2)];

	let last = graph.points[randomBetween(0, n-1, first.i)];
	let b = last.edges[random(n-2)];
	let tmp = a.value;
	a.value = b.value;
	b.value = tmp;

	while (improve(graph)){}

}

function randomBetween(min, max, except) {
	let n = max - min;
	if (except == undefined) {
		return Math.floor(Math.random() * n) + min;
	} else {
		while (true) {
			let chance = Math.floor(Math.random() * n) + min;
			if (chance != except) {
				return chance;
			}
		}
	}
}

function random(n, except) {
	return randomBetween(0, n, except);
}