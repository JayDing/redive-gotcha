module.exports = (db) => {
    const pools = {};

    pools.getPools = async () => {
        const client = await db.connect();
        let text = 'SELECT p.name, p.type, pi.id pi_id, pi.star, pi.normal, pi.last FROM pool p JOIN pool_info pi ON pi.pool_id=p.id ORDER BY p.name, pi.star';
        
        try {
            const { rows } = await client.query(text);

            client.release();

            return rows;
        } catch (err) {
            console.error(err.stack);
            client.release();
        }
    };

    pools.update = async (params) => {
        const client = await db.connect();
        
        let text = 'UPDATE pool_info SET normal=$1,last=$2 WHERE id=$3';
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

    return pools;
}