'use strict';
const fs = require('fs');
const path = require('path');


module.exports = {
	up: (queryInterface, Sequelize) => {
		/*
			Add altering commands here.
			Return a promise to correctly handle asynchronicity.

			Example:
			return queryInterface.bulkInsert('People', [{
				name: 'John Doe',
				isBetaMember: false
			}], {});
		*/
		let charList = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../character.json')));
		return queryInterface.bulkInsert('characters', charList, {});
	},

	down: (queryInterface, Sequelize) => {
		/*
			Add reverting commands here.
			Return a promise to correctly handle asynchronicity.

			Example:
			return queryInterface.bulkDelete('People', null, {});
		*/
	}
};
