const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ota_management', 'ota_user', 'ota_password', {
  host: 'db',
  dialect: 'postgres'
});

async function checkData() {
  try {
    const [apps] = await sequelize.query('SELECT COUNT(*) as count FROM applications');
    console.log('Applications count:', apps[0].count);
    
    const [devices] = await sequelize.query('SELECT COUNT(*) as count FROM devices');
    console.log('Devices count:', devices[0].count);
    
    const [logs] = await sequelize.query('SELECT COUNT(*) as count FROM update_logs');
    console.log('Update logs count:', logs[0].count);
    
    if (apps[0].count > 0) {
      const [appList] = await sequelize.query('SELECT id, name, package_name FROM applications LIMIT 3');
      console.log('\nApplications:', JSON.stringify(appList, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkData();
