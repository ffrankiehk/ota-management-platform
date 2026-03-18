const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('releases', 'full_bundle_url', {
      type: DataTypes.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('releases', 'full_bundle_hash', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });

    await queryInterface.addColumn('releases', 'full_bundle_size', {
      type: DataTypes.BIGINT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('releases', 'full_bundle_url');
    await queryInterface.removeColumn('releases', 'full_bundle_hash');
    await queryInterface.removeColumn('releases', 'full_bundle_size');
  }
};
