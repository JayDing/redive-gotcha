module.exports = (db) => {
    const characters = {};

    characters.findAll = async (param) => {
        const client = await db.connect();
        let text = 'SELECT * FROM characters ORDER BY star DESC, name DESC';

        try {
            const res = await client.query(text);

            client.release();

            return res;
        } catch (err) {
            console.error(err.stack);
            client.release();
        }
    };

    characters.getByPool = async (poolName, inpool) => {
        const client = await db.connect();
        let text = 'SELECT c.id id, c.name, c.star, ci.id rate_id, ci.inpool, ci.rateup, ci.prob_normal, ci.prob_last FROM characters c JOIN "charInfo" ci ON ci.char_id=c.id JOIN pool p ON p.id=ci.pool_id WHERE p.name=$1 ORDER BY c.star DESC, name DESC';
        
        if(inpool) text = text.replace('$1 ', `$1 AND ci.inpool=${inpool} `);

        try {
            const { rows } = await client.query(text, [poolName]);

            client.release();

            return rows;
        } catch (err) {
            console.error(err.stack);
            client.release();
        }
    };

    characters.getPoolBase = async (poolName) => {
        const client = await db.connect();
        let text = 'SELECT pi.* FROM "poolInfo" pi JOIN pool p ON p.id=pi.pool_id WHERE p.name=$1';

        try {
            const { rows } = await client.query(text, [poolName]);

            client.release();

            return rows;
        } catch (err) {
            console.error(err.stack);
            client.release();
        }
    };

    characters.query = async (param) => {
        const client = await db.connect();

        let { text, values } = param;
        try {
            const res = await client.query(text, values);

            client.release();

            return res;
        } catch (err) {
            console.error(err.stack);
            client.release();
        }
    };

    return characters;
};