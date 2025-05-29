module.exports = (sequelize, DataTypes) => {
  const Problem = sequelize.define('Problem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Geral'
    },
    tags: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      get() {
        const rawValue = this.getDataValue('tags');
        if (!rawValue) return [];
        return rawValue.split(',').map(tag => tag.trim()).filter(Boolean);
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('tags', value.join(','));
        } else if (typeof value === 'string') {
          this.setDataValue('tags', value);
        } else {
          this.setDataValue('tags', '');
        }
      }
    },
    files_json: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('files_json');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('files_json', JSON.stringify(value));
      }
    },
    youtubeLink: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'problems',
    timestamps: false
  });

  Problem.prototype.toJSON = function() {
    const values = { ...this.get() };
    values.files = values.files_json;
    delete values.files_json;
    return values;
  };

  return Problem;
}; 