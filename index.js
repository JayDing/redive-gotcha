const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000

const indexRouter = require('./routers/index');
const apiRouter = require('./routers/api');


app.set('view engine', 'pug');
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Listening on: http://localhost:${port}`);
});