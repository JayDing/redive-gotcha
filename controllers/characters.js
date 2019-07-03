const Characters = require('../models/characters.js').Characters;

module.exports = {
    list(req, res) {
        return Characters.findAll({
            order: [
                ['id', 'DESC']
            ]
        })
        .then(charList => res.status(200).send(charList))
        .catch(err => res.status(400).send(err));
    }
};