const db = require('../db').pg;

module.exports = {
	findAll: async (options) => {
		const client = await db.connect();
		
		let { select, orderBy } = options;
		let text;
		
		select = select ? (Array.isArray(select) ? select.join(', ') : select) : '*',
		orderBy = 'ORDER BY ' + (orderBy ? (Array.isArray(orderBy) ? orderBy.join(', ') : orderBy) : '');
		text = `SELECT ${select} FROM characters ${orderBy}`;
		try {
			const res = await client.query(text);
			
			client.release();
			
			return res;
		} catch (err) {
			console.error(err.stack);
			client.release();
		}
	},

	
};