const poolsModel = require('../models').pools;

module.exports = {
    list: async (req, res, next) => {
        const type = req.params.type;
    
        try {
            let rows = await poolsModel.getPools(type);
    
            res.locals.rows = rows;
    
            next();
        } catch (err) {
            console.error(err.stack);
            next();
        }
    },
    update: async (req, res, next) => {
        let data = req.body;
        try {
            data
                .forEach(async (field, i, arr) => {
                    await poolsModel.update({
                        values: [field.normal, field.last, field.pi_id]
                    });

                    if(arr.length - 1 === i) {
                        res.locals.queryResult = true;
                        next();
                    }
                });
        } catch (err) {
            console.error(err);
            res.locals.queryResult = false;
            next();
        }
    }
}