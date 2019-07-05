module.exports = (db) => {
	const characters = {};
	
	characters.findAll = async (param) => {
		const client = await db.connect();

		let text = `SELECT * FROM characters ORDER BY star DESC, name DESC`;
		try {
			const res = await client.query(text);
			
			client.release();
			
			return res;
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