const express = require('express');
const lineBot = require('linebot');
const path = require('path');
const libs = require('./libs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const sharp = require('sharp');
const request = require('request');

const app = express();
const port = process.env.PORT || 3000
const resultPath = path.join(__dirname, '/public/images/result.jpg');
const thumbPath = path.join(__dirname, '/public/images/thumb.jpg');

const bot = lineBot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

app.set('view engine', 'pug');
app.use('/static', express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
    res.render('index', {charList: libs.gotcha(true)});
});

app.get('/toImg', (req, res, next) => {
    const browser = puppeteer.launch({
        'args' : [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    browser
        .then(async browser => {
            //create screenshot
            const page = await browser.newPage();

            await page.goto('https://redive-gotcha.herokuapp.com/');
            await page.waitForSelector('#main')
            await page.setViewport({
                width: 890,
                height: 455
            });
            await page.screenshot({
                path: resultPath,
                type: 'jpeg'
            })            
            await browser.close();

            next();
        })
        .catch((err) => console.error(err));
}, (req, res, next) => {
    const inStream = fs.createReadStream(resultPath);
    const outStream = fs.createWriteStream(thumbPath, { flags: 'w' });
    
    inStream.pipe(sharp().resize(240, 123)).pipe(outStream);

    res.status(200).send('success');
});

app.get('/toImg/:type', (req, res) => {
    var type = req.params.type;
    res.sendFile(path.join(__dirname, '/public/images/' + type + '.jpg'))
});

app.post('/linewebhook', bot.parser());

bot.on('message', function (event) {
    switch(event.message.type) {
        case 'text':
            switch (event.message.text) {
                case '!抽':
                    request('https://redive-gotcha.herokuapp.com/toImg', (err, res, body) => {
                        if(!err && res.body == 'success') {
                            event.reply({
                                type: 'image',
                                originalContentUrl: 'https://redive-gotcha.herokuapp.com/toImg/result',
                                previewImageUrl: 'https://redive-gotcha.herokuapp.com/toImg/thumb'
                            })
                            .then(function (data) {
                                console.log('Success:', data);
                            })
                            .catch(function (err) {
                                console.error('Error:', err);
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

app.listen(port, () => console.log(`Listening on port: ${port}`));