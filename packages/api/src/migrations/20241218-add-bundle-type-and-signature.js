const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('releases', 'bundle_type', {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'js-bundle',
    });

    await queryInterface.addColumn('releases', 'signature', {
      type: DataTypes.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('releases', 'patch_from_version', {
      type: DataTypes.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn('releases', 'target_platform', {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'react-native',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('releases', 'bundle_type');
    await queryInterface.removeColumn('releases', 'signature');
    await queryInterface.removeColumn('releases', 'patch_from_version');
    await queryInterface.removeColumn('releases', 'target_platform');
  }
};
