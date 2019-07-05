const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const puppeteer = require('puppeteer');
const lineBot = require('linebot');
const request = require('request');

// star : [ normal, last ]
const base = { 1: [80, 0], 2: [18, 98], 3: [2, 2] };
const port = process.env.PORT || 3000

const charModel = require('../models').characters;

module.exports = {
	list: async (req, res, next) => {
		const probCalc = (charList, char) => {
			let cPool = charList.filter((c) => c.inpool === true && c.star === char.star);
		
			if(cPool.indexOf(char) === -1) return { normal: 0, last: 0 };
		
			if(char.rateup) return { normal: char.rate, last: char.rate };
			
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
				
				isLast = isLast ? 1 : 0
				if(poolRate <= base[3][isLast]) {
					listFiltered = charList.filter((c) => c.star === 3);
					listFiltered.push(...charList.filter((c) => c.star === 3 && c.rateup));
				} else if(poolRate > base[3][isLast] && poolRate <= (base[3][isLast] + base[2][isLast])) {
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

				if(arr.length - 1 === i) {
					res.locals.queryResult = true;

					next();
				}
			});
	},
	toImg: async (req, res) => {
		let timestamp = new Date().toISOString().split(/\./)[0].replace(/[-:T]/g, '');
		let imageName = `result_${timestamp}.jpg`;
		let imagePath = path.resolve(__dirname, '../public/images/', imageName);
		
		let resize = (file, width, height) => {
			let inStream = fs.createReadStream(file);
			let outStream = fs.createWriteStream(file.replace('result_', 'thumb_'), { flags: 'w' });
			
			inStream.pipe(sharp().resize(width, height)).pipe(outStream);
		}
	
		try {
			const browser = await puppeteer.launch({
				'args' : [
					'--no-sandbox',
					'--disable-setuid-sandbox'
				]
			});
	
			const page = await browser.newPage();
	
			await page.goto(`http://localhost:${port}/`);
			await page.waitForSelector('#main');
			await page.setViewport({
				width: 890,
				height: 455
			});
			await page.screenshot({
				path: imagePath,
				type: 'jpeg'
			})            
			await browser.close();
	
			resize(imagePath, 240, 123);
			res.status(200).send(timestamp);
		} catch (err) {
			console.error(err);
		}
	},
	getImg: (req, res) => {
		let filePath = path.resolve(__dirname, '../public/images/', req.params.file);
		
		if(fs.existsSync(filePath)) {
			let readStream = fs.createReadStream(filePath);
	
			readStream.pipe(res);
		} else {
			res.status(400).send('No Images!!');
		}
	},
	bot: () => {
		const bot = lineBot({
			channelId: process.env.CHANNEL_ID,
			channelSecret: process.env.CHANNEL_SECRET,
			channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
		});
		
		bot.on('message', (event) => {
			switch(event.message.type) {
				case 'text':
					switch (event.message.text) {
						case '!抽':
							request(`http://localhost:${port}/toImg`, (err, res, body) => {
								if(!err && res.statusCode == 200) {
									event.reply({
										type: 'image',
										originalContentUrl: `https://redive-gotcha.herokuapp.com/toImg/result_${body}.jpg`,
										previewImageUrl: `https://redive-gotcha.herokuapp.com/toImg/thumb_${body}.jpg`
									})
									.then(() => {
										console.log(`Reply "${event.message.text}" successfully`);
									})
									.catch((err) => {
										console.error('Error: ' + err);
									});
								} else {
									console.error('Oops! Something wrong!')
								}
							});
							break;
						default:
							break;
					}
				default:
					break;
			}
		});

		return bot.parser();
	}
};