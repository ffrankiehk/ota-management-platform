/**
 * 检查 update_logs 表结构
 */
const { Client } = require('pg');

async function checkTable() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ff906114',
    database: 'ota_platform',
  });

  try {
    await client.connect();
    
    // 检查表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'update_logs'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 update_logs 表结构:');
    console.log('─'.repeat(80));
    result.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} NULL: ${row.is_nullable}`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

checkTable();
