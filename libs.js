const fs = require('fs');
const sharp = require('sharp');
const lineBot = require('linebot');
const request = require('request');

let gotcha = (x10 = false) => {
    let charOutput = Array(x10 ? 10 : 1).fill(null);
    
    let getChar = (isLast = false) => {
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

let getCharList = () => {
    let charList = JSON.parse(fs.readFileSync('character.json'));
    charList.map((char, i, charList) => {
        char.prob = probCalc(charList, char);
        return char; 
    });
    return charList.sort((a, b) => b.star - a.star);
}

let probCalc = (charList, char) => {
    let cPool = charList.filter((c) => c.inPool === true && c.star === char.star);

    if(cPool.indexOf(char) == -1) return { normal: 0, last: 0 };

    if(char.rateUp) return { normal: char.rate, last: char.rate };
    
    // star : [ normal, last ]
    let base = { 1: [80, 0], 2: [18, 98], 3: [2, 2] };
    let cUpPool = cPool.filter((c) => c.rateUp === true);
    let cUp = cUpPool.reduce((init, char) => init + char.rate , 0);

    return {
        normal: Math.round((base[char.star][0] - cUp) / (cPool.length - cUpPool.length) * 10000 ) / 10000,
        last: Math.round((base[char.star][1] - cUp) / (cPool.length - cUpPool.length) * 10000 ) / 10000
    };
}

let updateCharList = (data) => {
    let charList = JSON.parse(fs.readFileSync('character.json'));
    let output;

    charList.map((char) => {
        char.inPool = data.inPool && Object.keys(data.inPool).indexOf(char.name) != -1;
        char.rateUp = char.inPool && data.rateUp && Object.keys(data.rateUp).indexOf(char.name) != -1;
        if(char.rateUp && data.rate && Object.keys(data.rateUp).indexOf(char.name) != -1 && !Number.isNaN(data.rate[char.name])) {
            char.rateUp = data.rate[char.name] > 0;
            char.rate = (data.rate[char.name] > 0) ? Number(data.rate[char.name]) : 0;
        }

        return char;
    });

    output = JSON.stringify(charList);
    
    try {
        fs.writeFileSync('character.json', output);
        console.log('character.json is updated');
    } catch(err) {
        console.error('character.json updated Error: ' + err);
    }
}

let resize = (file, width, height) => {
    const inStream = fs.createReadStream(file);
    const outStream = fs.createWriteStream(file.replace('result_', 'thumb_'), { flags: 'w' });
    
    inStream.pipe(sharp().resize(width, height)).pipe(outStream);
}

let bot = () => {
    const port = process.env.PORT || 3000
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

    return bot;
}

let cron = (ms, fn) => {
    let cb = () => {
        clearTimeout(timeout);
        timeout = setTimeout(cb, ms);
        fn();
    }

    let timeout = setTimeout(cb, ms)
}

module.exports = { gotcha, getCharList, updateCharList, resize, bot, cron };