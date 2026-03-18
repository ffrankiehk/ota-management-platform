/**
 * 检查测试数据是否正确
 */
const { Client } = require('pg');

async function checkData() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ff906114',
    database: 'ota_platform',
  });

  try {
    await client.connect();
    console.log('✅ 连接成功\n');

    // 检查 Application
    console.log('📱 Applications:');
    console.log('─'.repeat(80));
    const apps = await client.query(`
      SELECT id, bundle_id, platform, is_active 
      FROM applications 
      WHERE bundle_id = 'com.test.otaapp';
    `);
    console.log(apps.rows);

    // 检查 Releases
    console.log('\n📦 Releases:');
    console.log('─'.repeat(80));
    const releases = await client.query(`
      SELECT id, application_id, version, status 
      FROM releases 
      WHERE application_id IN (SELECT id FROM applications WHERE bundle_id = 'com.test.otaapp');
    `);
    console.log(releases.rows);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

checkData();
