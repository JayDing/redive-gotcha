const path = require('path');
const express = require('express');
const libs = require('./libs');
const puppeteer = require('puppeteer');
const lineBot = require('linebot');

const bot = lineBot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

const app = express();
const port = process.env.PORT || 3000

app.set('view engine', 'pug');
app.use('/static', express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => res.render('index', {charList: libs.gotcha(true)}));
app.get('/toImg', (req, res) => {
    const browser = puppeteer.launch({
        'args' : [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    browser
        .then(async browser => {
            const page = await browser.newPage();
            await page.goto('https://redive-gotcha.herokuapp.com/');
            await page.waitForSelector('#main')
            await page.setViewport({
                width: 890,
                height: 455
            });
            await page.screenshot({
                path: './public/images/result.jpg',
                type: 'jpeg'
            });
            await browser.close();
            
            res.sendFile(path.join(__dirname, '/public/images/result.jpg'));
        })
        .catch((err) => console.error(err));
});
app.post('/linewebhook', bot.parser());

bot.on('message', function (event) {
    switch(event.message.type) {
        case 'text':
            switch (event.message.text) {
                case '!抽':
                    event.reply({
                            type: 'image',
                            originalContentUrl: 'https://redive-gotcha.herokuapp.com/toImg',
                            previewImageUrl: 'https://redive-gotcha.herokuapp.com/toImg'
                        })
                        .then(function (data) {
                            console.log('Success:', data);
                        })
                        .catch(function (err) {
                            console.error('Error:', err);
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