const charModel = require('../models').characters;

module.exports = {
	list: async (req, res, next) => {
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
		};

		let { rows } = await charModel.findAll();

		rows.map((char, i, charList) => {
			char.prob = probCalc(charList, char);
			return char; 
		});

		res.locals.rows = rows;

		next();
	},
	gotcha: async (req, res, next) => {
		const gotcha = (charList, x10 = false) => {
			let charOutput = Array(x10 ? 10 : 1).fill(null);
			let getChar = (isLast = false) => {
				let poolRate = Math.floor(Math.random() * 100) + 1;
				
				if(poolRate <= 2) {
					listFiltered = charList.filter((c) => c.star === 3);
					listFiltered.push(...charList.filter((c) => c.star === 3 && c.rateup));
				} else if(poolRate > 2 && poolRate <= (!isLast ? 20 : 100)) {
					listFiltered = charList.filter((c) => c.star === 2);
				} else {
					listFiltered = charList.filter((c) => c.star === 1);
				}
		
				return listFiltered[Math.floor(Math.random() * listFiltered.length)];
			}
		
			charOutput = charOutput.map((e, i, arr) => getChar(arr.length - 1 === i));
			
			return charOutput;
		}

		let { rows } = await charModel.query({
			text: 'SELECT * FROM characters WHERE inpool=$1 ORDER BY star DESC, id ASC',
			values: [true]
		});
					

		res.locals.rows = gotcha(rows, true);

		next();
	},
	update: async (req, res, next) => {
		let data = req.body;

		let { rows } = await charModel.query({
			text: 'SELECT * FROM characters ORDER BY id ASC'
		});

		data = Object.values(data)
			.map((field) => {
				let output = {
					id: Number(field.id),
					inpool: field.inpool != undefined,
					rateup: field.inpool != undefined && field.rateup != undefined,
					rate: 0
				};

				if(output.rateup && field.rate != undefined && !Number.isNaN(field.rate)) {
					output.rateup = field.rate > 0;
					output.rate = field.rate > 0 ? Number(field.rate) : 0;
				}
				
				return output;
			})
			.sort((a, b) => a.id - b.id);

		data
			.filter((field, i) => {
				return field.inpool != rows[i].inpool || field.rateup != rows[i].rateup || field.rate != rows[i].rate;
			})
			.forEach(async (field, i, arr) => {
				await charModel.query({
					text: 'UPDATE characters SET inpool=$1,rateup=$2,rate=$3 WHERE id=$4',
					values: [field.inpool, field.rateup, field.rate, field.id]
				});

				if(i == (arr.length - 1)) {
					res.locals.queryResult = true;

					next();
				}
			});
	}
};