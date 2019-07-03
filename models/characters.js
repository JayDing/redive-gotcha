'use strict';
module.exports = (sequelize, DataTypes) => {
  const Characters = sequelize.define('Characters', {
    id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    star: DataTypes.SMALLINT,
    inpool: DataTypes.BOOLEAN,
    rateup: DataTypes.BOOLEAN,
    rate: DataTypes.REAL
  }, {});
  Characters.associate = function(models) {
    // associations can be defined here
  };
  return Characters;
};