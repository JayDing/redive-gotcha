const pg = require('pg');

const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

const characters = require('./characters')(pgPool);
const pools = require('./pools')(pgPool);

module.exports = {
    characters,
    pools
};