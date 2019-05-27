const fs = require('fs');
const sharp = require('sharp');
const lineBot = require('linebot');
const request = require('request');

let gotcha = function(x10 = false) {
    let charOutput = Array(x10 ? 10 : 1).fill(null);
    
    let getChar = function(isLast = false) {
        let charList = JSON.parse(fs.readFileSync('character.json'));
        let poolRate = Math.floor(Math.random() * 100) + 1;

        charList = charList.filter((c) => c.inPool === true);
        
        if(poolRate <= 2) {
            listFiltered = charList.filter((c) => c.star === 3);
            listFiltered.push(...charList.filter((c) => c.star === 3 && c.rateUp));
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

let getCharList = function() {
    let charList = JSON.parse(fs.readFileSync('character.json'));
    charList.map((char, i, charList) => {
        char.prob = probCalc(charList, char);
        return char; 
    });
    return charList.sort((a, b) => b.star - a.star);
}

let probCalc = function(charList, char) {
    let cPool = charList.filter((c) => c.inPool === true && c.star === char.star);
    
    if(cPool.indexOf(char) == -1) return 0;

    let cUp = cPool.filter((c) => c.rateUp === true);
    let base = 0
    switch(char.star) {
        case 1: base = 80; break;
        case 2: base = 18; break;
        case 3: base = 2; break;
    }
    
    return Math.round( (base * (char.rateUp ? char.rate : 1)) / (cPool.length + cUp.length * (char.rate - 1)) * 100 ) / 100;
}

let updateCharList = function(data) {
    let charList = JSON.parse(fs.readFileSync('character.json'));
    let output;

    charList.map((char) => {
        char.inPool = data.inPool && Object.keys(data.inPool).indexOf(char.name) != -1;
        char.rateUp = data.rateUp && Object.keys(data.rateUp).indexOf(char.name) != -1 && char.inPool;
        
        return char;
    })
    
    output = JSON.stringify(charList);
    
    fs.writeFile('character.json', output, (err) => {
        if (err) console.error(err);
        console.log('character.json is updated');
    });
}

let resize = function(file, width, height) {
    const inStream = fs.createReadStream(file);
    const outStream = fs.createWriteStream(file.replace('result_', 'thumb_'), { flags: 'w' });
    
    inStream.pipe(sharp().resize(width, height)).pipe(outStream);
}

let bot = function() {
    const bot = lineBot({
        channelId: process.env.CHANNEL_ID,
        channelSecret: process.env.CHANNEL_SECRET,
        channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
    });

    bot.on('message', function (event) {
        switch(event.message.type) {
            case 'text':
                switch (event.message.text) {
                    case '!抽':
                        request('https://redive-gotcha.herokuapp.com/toImg', (err, res, body) => {
                            if(!err && res.statusCode == 200) {
                                event.reply({
                                    type: 'image',
                                    originalContentUrl: `https://redive-gotcha.herokuapp.com/toImg/result_${body}.jpg`,
                                    previewImageUrl: `https://redive-gotcha.herokuapp.com/toImg/thumb_${body}.jpg`
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

    return bot;
}

let cron = function(ms, fn) {
    let cb = function() {
        clearTimeout(timeout);
        timeout = setTimeout(cb, ms);
        fn();
    }

    let timeout = setTimeout(cb, ms)
}

module.exports = { gotcha, getCharList, updateCharList, resize, bot, cron };