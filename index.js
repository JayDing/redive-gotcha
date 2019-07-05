const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000

const libs = require('./libs');
const indexRouter = require('./routers/index');
const apiRouter = require('./routers/api');


app.set('view engine', 'pug');
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

app.listen(port, () => {
    libs.startKeepAlive();
    console.log(`Listening on: http://localhost:${port}`);
});