const pg = require('pg');

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

const characters = require('./characters')(pool);

module.exports = {
    characters
};