const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './wiki.db',
  logging: false
});

const db = {
  sequelize,
  Sequelize
};

// Importar modelos
db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Problem = require('./problem')(sequelize, Sequelize.DataTypes);

// Definir associações
db.Problem.belongsTo(db.User, { as: 'author', foreignKey: 'author_id' });
db.User.hasMany(db.Problem, { foreignKey: 'author_id' });

module.exports = db; 