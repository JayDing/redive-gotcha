const express = require('express');
const path = require('path');
const libs = require('./libs');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000
const resultPath = path.join(__dirname, '/public/images/result.jpg');
const thumbPath = path.join(__dirname, '/public/images/thumb.jpg');
const bot = libs.bot();

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
    libs.resize(resultPath, thumbPath, 240, 123);
    res.status(200).send('success');
});

app.get('/toImg/:type', (req, res) => {
    const type = req.params.type;
    res.sendFile(path.join(__dirname, '/public/images/' + type + '.jpg'))
});

app.post('/linewebhook', bot.parser());

app.listen(port, () => console.log(`Listening on port: ${port}`));