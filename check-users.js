/**
 * 检查所有用户账号
 */
const { Client } = require('pg');

async function checkUsers() {
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

    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.is_active,
        o.name as organization_name,
        u.created_at
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at;
    `);

    console.log('👥 所有用户账号:');
    console.log('─'.repeat(120));
    console.log('Email'.padEnd(30), 'Role'.padEnd(15), 'Organization'.padEnd(30), 'Active', 'Created');
    console.log('─'.repeat(120));
    
    result.rows.forEach(row => {
      console.log(
        row.email.padEnd(30),
        row.role.padEnd(15),
        (row.organization_name || 'N/A').padEnd(30),
        row.is_active ? '✅' : '❌',
        row.created_at.toISOString().substring(0, 19)
      );
    });
    
    console.log('─'.repeat(120));
    console.log(`\n总计: ${result.rows.length} 个用户\n`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
