const express = require('express');
const router = express.Router();

const charController = require('../controllers').characters;

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const puppeteer = require('puppeteer');

const lineBot = require('linebot');
const request = require('request');

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

router.get('/', charController.gotcha, (req, res) => {
    if(res.locals.rows) {
        res.render('index', { page: 'index', charList: res.locals.rows });
    } else {
        res.status(400).send('No data!!');
    }
});

router.get('/settings', charController.list, (req, res) => {
    if(res.locals.rows) {
        res.render('settings', { page: 'settings', charList: res.locals.rows });
    } else {
        res.status(400).send('No data!!');
    }
});

router.post('/settings', express.urlencoded({ extended: true }), charController.update, (req, res) => {
    if(res.locals.queryResult) {
        res.redirect(301, '/settings');
    } else {
        res.status(400).send('Update Failed!!');
    }
});


router.get('/toImg', async (req, res) => {
    let port = process.env.PORT || 3000

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
});

router.get('/toImg/:file', (req, res) => {
    let filePath = path.resolve(__dirname, '../public/images/', req.params.file);
    
    if(fs.existsSync(filePath)) {
        let readStream = fs.createReadStream(filePath);

        readStream.pipe(res);
    } else {
        res.status(400).send('No Images!!');
    }
});

router.post('/linewebhook', bot.parser());

module.exports = router;
