/**
 * Add indexes for device_id columns to optimize queries
 * - update_logs.device_id: used for joining with devices and filtering
 * - devices.device_id: used for lookups and joins
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add index on update_logs.device_id for faster joins and queries
    await queryInterface.addIndex('update_logs', ['device_id'], {
      name: 'idx_update_logs_device_id',
    });

    // Add index on devices.device_id for faster lookups
    // Note: devices already has unique constraint on (application_id, device_id)
    // but adding a single-column index on device_id helps with update_logs joins
    await queryInterface.addIndex('devices', ['device_id'], {
      name: 'idx_devices_device_id',
    });

    console.log('✅ Added indexes for device_id columns');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('update_logs', 'idx_update_logs_device_id');
    await queryInterface.removeIndex('devices', 'idx_devices_device_id');
    console.log('✅ Removed device_id indexes');
  },
};
