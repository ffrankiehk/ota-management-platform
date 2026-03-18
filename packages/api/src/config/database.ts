import { Sequelize } from 'sequelize';
import { config } from './index';

// Determine dialect from DATABASE_URL
const isPostgres = config.database.url.startsWith('postgres');

// Create Sequelize instance
export const sequelize = isPostgres
  ? new Sequelize(config.database.url, {
      dialect: 'postgres',
      logging: config.env === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    })
  : new Sequelize(config.database.url, {
      dialect: 'sqlite',
      logging: config.env === 'development' ? console.log : false,
      storage: './database/ota_dev.sqlite',
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    });

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await testConnection();

    if (config.env === 'development') {
      // Sync models in development. For SQLite we avoid `alter` to prevent
      // foreign key constraint issues when dropping tables.
      await sequelize.sync();
      console.log('✅ Database models synchronized.');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};
