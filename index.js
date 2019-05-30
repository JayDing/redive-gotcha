const express = require('express');
const libs = require('./libs');
const path = require('path');
const bodyparser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000
const bot = libs.bot();

app.set('view engine', 'pug');
app.use('/static', express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
    res.render('index', { page: 'index', charList: libs.gotcha(true) });
});

app.get('/settings', (req, res) => {
    res.render('settings', { page: 'settings', charList: libs.getCharList() });
});

app.post('/settings', bodyparser.urlencoded({ extended: true }), (req, res) => {
    libs.updateCharList(req.body);
    res.redirect(301, '/settings');
});

app.get('/toImg', (req, res) => {
    let timestamp = new Date().toISOString().split(/\./)[0].replace(/[-:T]/g, '');
    let imageName = `result_${timestamp}.jpg`;
    let imagePath = path.join(__dirname, '/public/images/', imageName);
    
    const browser = puppeteer.launch({
        'args' : [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    browser
        .then(async browser => {
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

            libs.resize(imagePath, 240, 123);
            res.status(200).send(timestamp);
        })
        .catch((err) => console.error(err));
});

app.get('/toImg/:file', (req, res) => {
    const file = req.params.file;
    res.sendFile(path.join(__dirname, '/public/images/', file));
});

app.post('/linewebhook', bot.parser());

app.listen(port, () => console.log(`Listening on port: ${port}`));