const pg = require('pg');
const fs = require('fs');
const sharp = require('sharp');
const lineBot = require('linebot');
const request = require('request');
const emoji = require('node-emoji');

const port = process.env.PORT || 3000
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

let getCharList = async () => {
    const client = await pool.connect();
    
    try {
        const res = await client.query('SELECT * FROM characters ORDER BY star DESC, id ASC');
        
        client.release();
        
        res.rows
            .map((char, i, charList) => {
                char.prob = probCalc(charList, char);
                return char; 
            });

        return res.rows.sort((a,b) => b.star - a.star);
    } catch (err) {
        client.release();
        console.error(err.stack);
    }
}

let probCalc = (charList, char) => {
    let cPool = charList.filter((c) => c.inpool === true && c.star === char.star);

    if(cPool.indexOf(char) == -1) return { normal: 0, last: 0 };

    if(char.rateup) return { normal: char.rate, last: char.rate };
    
    // star : [ normal, last ]
    let base = { 1: [80, 0], 2: [18, 98], 3: [2, 2] };
    let cUpPool = cPool.filter((c) => c.rateup === true);
    let cUp = cUpPool.reduce((init, char) => init + char.rate , 0);

    return {
        normal: Math.round((base[char.star][0] - cUp) / (cPool.length - cUpPool.length) * 10000 ) / 10000,
        last: Math.round((base[char.star][1] - cUp) / (cPool.length - cUpPool.length) * 10000 ) / 10000
    };
}

let updateCharList = async (data) => {
    const client = await pool.connect();

    data = Object.values(data)
        .map((option) => {
            let output = {
                id: Number(option.id),
                inpool: option.inpool != undefined,
                rateup: option.inpool != undefined && option.rateup != undefined,
                rate: 0
            };

            if(output.rateup && option.rate != undefined && !Number.isNaN(option.rate)) {
                output.rateup = option.rate > 0;
                output.rate = option.rate > 0 ? Number(option.rate) : 0;
            }
            
            return output; 
        })
        .sort((a, b) => a.id - b.id);

    try {
        const res = await client.query('SELECT * FROM characters ORDER BY id ASC');
        
        data
            .filter((option, i) => {
                return option.inpool != res.rows[i].inpool || option.rateup != res.rows[i].rateup || option.rate != res.rows[i].rate;
            })
            .forEach(async (option) => {
                console.log(option);

                try {
                    await client.query('UPDATE characters SET inpool=$1,rateup=$2,rate=$3 where id=$4', [option.inpool, option.rateup, option.rate, option.id]);
                } catch (err) {
                    console.error(err);
                }
            });

        client.release();
    } catch (err) {
        client.release();
        console.error(err);
    }
}


let gotcha = (charList, x10 = false) => {
    let charOutput = Array(x10 ? 10 : 1).fill(null);
    
    charList = charList.filter((c) => c.inpool === true);
    
    let getChar = (isLast = false) => {
        let poolRate = Math.floor(Math.random() * 100) + 1;
        
        if(poolRate <= 2) {
            listFiltered = charList.filter((c) => c.star === 3);
            listFiltered.push(...charList.filter((c) => c.star === 3 && c.rateup));
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

let resize = (file, width, height) => {
    const inStream = fs.createReadStream(file);
    const outStream = fs.createWriteStream(file.replace('result_', 'thumb_'), { flags: 'w' });
    
    inStream.pipe(sharp().resize(width, height)).pipe(outStream);
}

let bot = () => {
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

let emojiOnMissing = (name) => {
    return name;
}

let cron = (ms, fn) => {
    let cb = () => {
        clearTimeout(timeout);
        timeout = setTimeout(cb, ms);
        fn();
    }

    let timeout = setTimeout(cb, ms);
}

let startKeepAlive = () => {
    cron(20 * 60 * 1000, () => {
        request('https://redive-gotcha.herokuapp.com/', (err, res, body) => {
            console.log('Are you alive? ', res.statusCode === 200);
        });
    });
}

module.exports = { gotcha, getCharList, updateCharList, resize, bot, cron, startKeepAlive};