const path = require('path');
const express = require('express');
const libs = require('./libs');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000

app.set('view engine', 'pug');
app.use('/static', express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => res.render('index', {charList: libs.gotcha(true)}));
app.get('/toimg', (req, res) => {
    const browser = puppeteer.launch();

    browser
        .then(async browser => {
            const page = await browser.newPage();
            await page.goto('http://localhost:3000/');
            console.log(page);
            await page.waitForSelector('#main')
            await page.setViewport({
                width: 890,
                height: 455
            });
            await page.screenshot({path: './public/images/result.png'});
            await browser.close();
            
            res.sendFile(path.join(__dirname, '/public/images/result.png'));
        })
        .catch((err) => console.log(err));
});

app.listen(port, () => console.log(`Listening on port: ${port}`));