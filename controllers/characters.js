const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const puppeteer = require('puppeteer');
const lineBot = require('linebot');
const request = require('request');

const port = process.env.PORT || 3000;

const charModel = require('../models').characters;

module.exports = {
    list: async (req, res, next) => {
        const type = req.params.type;

        try {
            let rows = await charModel.getByPool(type);

            res.locals.rows = rows;

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
                        values: [field.inpool, field.rateup, field.prob_normal, field.prob_last, field.rate_id]
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
    gotcha: async (req, res, next) => {
        const type = req.params.type;
        const gotcha = (charList, x10 = false) => {
            let charOutput = Array(x10 ? 10 : 1).fill(null);
            let getChar = (isLast) => {
                let rnd = Math.random() * 100;
                let total = 0;

                charList = charList
                    .filter(char => char.inpool)
                    .sort(() => (Math.random() > 0.5) ? 1 : -1);

                for(let char of charList) {
                    let prob = isLast ? char.prob_last : char.prob_normal;

                    total += prob;
                    if(rnd <= total) {
                        return char;
                    }
                }
                return charList[charList.length - 1];
            }

            charOutput = charOutput.map((e, i, arr) => getChar(arr.length - 1 === i));
            return charOutput;
        }

        try {
            let rows = await charModel.getByPool(type, true);
            res.locals.rows = gotcha(rows, true);

            next();
        } catch (err) {
            console.error(err.stack);
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
            
            await page.goto(`http://localhost:${port}/gotcha/${type}`);
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
            res.status(200).json({ normal: fileName, thumb: thumbName });
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
        const imgRequset = (event, type) => {
            request(`http://localhost:${port}/toImg/${type}`, (err, res, body) => {
                if(!err && res.statusCode == 200) {
                    const file = JSON.parse(body);
                    event.reply({
                        type: 'image',
                        originalContentUrl: `https://redive-gotcha.herokuapp.com/getImg/${file.normal}`,
                        previewImageUrl: `https://redive-gotcha.herokuapp.com/getImg/${file.thumb}`
                    })
                    .then(() => {
                        console.log(`Reply "${event.message.text}" successfully`);
                    })
                    .catch((err) => {
                        console.error('Error: ' + err);
                    });
                } else {
                    console.error('Oops! Something wrong!');
                    console.error(err);
                }
            });
        }

        bot.on('message', (event) => {
            switch(event.message.type) {
                case 'text':
                    switch (event.message.text.toLowerCase()) {
                        case '!抽白金':
                        case '!dn':
                            imgRequset(event, 'normal');
                        case '!抽精選':
                        case '!df':
                            imgRequset(event, 'featured');
                        case '!抽必中':
                        case '!dm':
                            imgRequset(event, 'must3Star');
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