const fs = require('fs');
const express = require('express');
const app = express();

var gotcha = function(x10 = false) {
    var charOutput = Array(x10 ? 10 : 1).fill(null);
    
    var getChar = function(isLast = false) {
        var charList = JSON.parse(fs.readFileSync('charcter.json'));
        var poolRate = Math.floor(Math.random() * 100) + 1;

        charList = charList.filter((c) => c.inPool === true);
        
        if(poolRate <= 2) {
            listFiltered = charList.filter((c) => c.star === 3);
            listFiltered.push(...charList.filter((c) => c.star === 3 && c.rateUp === 2));
            console.log(listFiltered);
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

app.set('view engine', 'pug');
app.use('/static', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index', {charList: gotcha(true)});
});

app.listen(process.env.port || 5000, function() {
    var port = this.address().port;
    console.log("Express is working on port " + port);
});