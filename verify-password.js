/**
 * 验证密码
 */
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ff906114',
    database: 'ota_platform',
  });

  try {
    await client.connect();
    
    // 获取 admin@example.com 的密码 hash
    const result = await client.query(`
      SELECT email, password_hash, role
      FROM users
      WHERE email = 'admin@example.com';
    `);

    if (result.rows.length === 0) {
      console.log('❌ 用户不存在');
      return;
    }

    const user = result.rows[0];
    console.log('✅ 找到用户:', user.email);
    console.log('   Role:', user.role);
    console.log('   Password Hash:', user.password_hash.substring(0, 30) + '...\n');

    // 测试几个可能的密码
    const testPasswords = ['admin123', 'admin', 'password', 'test123456'];
    
    console.log('🔐 测试密码:');
    for (const password of testPasswords) {
      const match = await bcrypt.compare(password, user.password_hash);
      console.log(`  "${password}": ${match ? '✅ 匹配' : '❌ 不匹配'}`);
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

verifyPassword();
