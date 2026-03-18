/**
 * 测试 Update Logs API
 */
const { Client } = require('pg');

async function testAPI() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ff906114',
    database: 'ota_platform',
  });

  try {
    await client.connect();
    console.log('📊 直接查询 Update Logs:\n');

    // 直接查询，带 Release 和 Application 信息
    const result = await client.query(`
      SELECT 
        ul.id,
        ul.device_id,
        ul.status,
        ul.error_message,
        ul.download_time_ms,
        ul.install_time_ms,
        ul.device_info,
        ul.installed_at,
        ul.created_at,
        r.id as release_id,
        r.version as release_version,
        a.id as app_id,
        a.name as app_name,
        a.bundle_id as app_bundle_id
      FROM update_logs ul
      LEFT JOIN releases r ON ul.release_id = r.id
      LEFT JOIN applications a ON r.application_id = a.id
      ORDER BY ul.created_at DESC
      LIMIT 20;
    `);

    console.log(`找到 ${result.rows.length} 条记录:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Status: ${row.status}`);
      console.log(`   Device: ${row.device_id}`);
      console.log(`   Release: ${row.release_version} (${row.app_name})`);
      console.log(`   Time: ${row.created_at.toISOString()}`);
      console.log();
    });

    console.log('✅ 数据库查询成功！');
    console.log('\n问题可能在 Sequelize 模型加载或关联配置。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

testAPI();
