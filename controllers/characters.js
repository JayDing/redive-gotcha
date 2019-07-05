const charModel = require('../models').characters;

const probCalc = (charList, char) => {
	let cPool = charList.filter((c) => c.inpool === true && c.star === char.star);

	if(cPool.indexOf(char) == -1) return { normal: 0, last: 0 };

	if(char.rateup) return { normal: char.rate, last: char.rate };
	
	// star : [ normal, last ]
	let base = { 1: [80, 0], 2: [18, 98], 3: [2, 2] };
	let cUpPool = cPool.filter((c) => c.rateup === true);
	let cUp = cUpPool.reduce((init, char) => init + char.rate , 0);

	return {
		normal: Math.round((base[char.star][0] - cUp) / (cPool.length - cUpPool.length) * 10000 ) / 10000,
		last: Math.round((base[char.star][1] - cUp) / (cPool.length - cUpPool.length) * 10000 ) / 10000
	};
}

module.exports = {
	list: async (req, res) => {
		let { rows } = await charModel.findAll({
			orderBy: ['star DESC', 'name DESC']
		});

		rows.map((char, i, charList) => {
			char.prob = probCalc(charList, char);
			return char; 
		});
				
		res.status(200).send(rows);
	},
};