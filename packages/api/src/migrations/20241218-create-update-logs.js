const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('update_logs', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      device_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      release_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'releases',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      download_time_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Download time in milliseconds'
      },
      install_time_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Install time in milliseconds'
      },
      device_info: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      installed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('update_logs', ['device_id']);
    await queryInterface.addIndex('update_logs', ['release_id']);
    await queryInterface.addIndex('update_logs', ['status']);
    await queryInterface.addIndex('update_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('update_logs');
  }
};
