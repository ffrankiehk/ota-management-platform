const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:ff906114@localhost:5432/ota_platform',
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://ota_user:ota_password@localhost:5432/ota_platform_test',
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
