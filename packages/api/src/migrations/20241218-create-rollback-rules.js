const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('rollback_rules', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      failure_threshold: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5.0,
      },
      time_window_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
      },
      min_install_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      rollback_to_version: {
        type: DataTypes.STRING(50),
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

    await queryInterface.addIndex('rollback_rules', ['release_id']);
    await queryInterface.addIndex('rollback_rules', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rollback_rules');
  }
};
