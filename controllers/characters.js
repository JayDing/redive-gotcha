const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const puppeteer = require('puppeteer');
const lineBot = require('linebot');
const request = require('request');

// STAR : [ normal, last ]
const base = { 1: [80, 0], 2: [18, 98], 3: [2, 2] };
const port = process.env.PORT || 3000

const charModel = require('../models').characters;

module.exports = {
    list: async (req, res, next) => {
        const type = req.params.type;
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

        try {
            let { rows } = await charModel.query({
                text: 'SELECT c.id id, c.name, c.star, r.inpool, r.rateup, r.rate, r.id rate_id, r.pool_type FROM characters c JOIN rate r ON c.id = r.char_id WHERE r.pool_type=$1 ORDER BY c.star DESC, name DESC',
                values: [type]
            });

            rows.map((char, i, charList) => {
                char.prob = probCalc(charList, char);
                return char; 
            });

            res.locals.rows = rows;

            next();
        } catch (err) {
            console.error(err.stack);
            next();
        }
    },
    gotcha: async (req, res, next) => {
        // const type = req.params.type;
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

        try {
            let { rows } = await charModel.query({
                text: 'SELECT c.id id, c.name, c.star, r.inpool, r.rateup, r.rate, r.id rate_id, r.pool_type FROM characters c JOIN rate r ON c.id = r.char_id WHERE r.pool_type=$1 AND r.inpool=$2 ORDER BY c.star DESC, name DESC',
                values: ['featured', true]
            });

            res.locals.rows = gotcha(rows, true);

            next();
        } catch (err) {
            console.error(err.stack);
            next();
        }
    },
    update: async (req, res, next) => {
        let data = req.body;

        try {
            data
                .forEach(async (field, i, arr) => {
                    await charModel.query({
                        text: 'UPDATE rate SET inpool=$1,rateup=$2,rate=$3 WHERE id=$4',
                        values: [field.inpool, field.rateup, field.rate, field.rate_id]
                    });

                    if(arr.length - 1 === i) {
                        res.locals.queryResult = true;
                        next();
                    }
                });
        } catch (err) {
            console.error(err);
            res.locals.queryResult = false;
            next();
        }
    },
    toImg: async (req, res) => {
        const type = req.params.type;
        let timestamp = new Date().toISOString().split(/\./)[0].replace(/[-:T]/g, '');
        let fileName = `${type}_${timestamp}.jpg`;
        let thumbName = `${type}_thumb_${timestamp}.jpg`;
        let filePath = path.resolve(__dirname, '../public/images/', fileName);
        let thumbPath = path.resolve(__dirname, '../public/images/', thumbName);
        
        let resize = (file, target, width, height) => {
            let inStream = fs.createReadStream(file);
            let outStream = fs.createWriteStream(target, { flags: 'w' });
            
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

            await page.goto(`http://localhost:${port}/gotcha`);
            await page.waitForSelector('#main');
            await page.setViewport({
                width: 890,
                height: 455
            });
            await page.screenshot({
                path: filePath,
                type: 'jpeg'
            })            
            await browser.close();

            resize(filePath, thumbPath, 240, 123);
            res.status(200).json({ file: fileName, thumb: thumbName });
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
                        case '!æŠ½':
                            request(`http://localhost:${port}/toImg`, (err, res, body) => {
                                if(!err && res.statusCode == 200) {
                                    event.reply({
                                        type: 'image',
                                        originalContentUrl: `https://redive-gotcha.herokuapr.com/getImg/${body.file}.jpg`,
                                        previewImageUrl: `https://redive-gotcha.herokuapr.com/getImg/${body.thumb}.jpg`
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