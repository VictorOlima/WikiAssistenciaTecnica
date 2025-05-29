const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(80),
      unique: true,
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'tecnico', 'user']]
      }
    }
  }, {
    tableName: 'users',
    timestamps: false
  });

  // Métodos de instância
  User.prototype.setPassword = async function(password) {
    this.password_hash = await bcrypt.hash(password, 10);
  };

  User.prototype.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return User;
}; 