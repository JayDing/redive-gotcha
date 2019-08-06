module.exports = (db) => {
    const characters = {};

    characters.findAll = async (params) => {
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

    characters.getByPool = async (poolType, inpool) => {
        const client = await db.connect();

        let text = 'SELECT c.id id, c.name, c.star, ci.id rate_id, ci.inpool, ci.rateup, ci.prob_normal, ci.prob_last, pi.normal base_normal, pi.last base_last FROM characters c JOIN char_info ci ON ci.char_id=c.id JOIN pool p ON p.id=ci.pool_id JOIN pool_info pi ON pi.pool_id=p.id AND pi.star=c.star WHERE p.type=$1 ORDER BY c.star DESC, c.name DESC';
        
        if(inpool) text = text.replace('$1 ', `$1 AND ci.inpool=${inpool} `);
        try {
            const { rows } = await client.query(text, [poolType]);

            client.release();

            return rows;
        } catch (err) {
            console.error(err.stack);
            client.release();
        }
    };
    
    characters.update = async (params) => {
        const client = await db.connect();
        
        let text = 'UPDATE char_info SET inpool=$1,rateup=$2,prob_normal=$3,prob_last=$4 WHERE id=$5';
        let { values } = params;
        try {
            const res = await client.query(text, values);

            client.release();

            return res;
        } catch (err) {
            console.error(err.stack);
            client.release();
        }
    };

    characters.query = async (params) => {
        const client = await db.connect();

        let { text, values } = params;
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