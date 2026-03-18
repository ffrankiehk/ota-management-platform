/**
 * 创建 admin 用户
 */
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
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

    // 获取第一个 organization
    const orgResult = await client.query('SELECT id FROM organizations LIMIT 1');
    const orgId = orgResult.rows[0].id;

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 创建 admin 用户
    await client.query(`
      INSERT INTO users (id, organization_id, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        '${orgId}',
        'admin@example.com',
        '${hashedPassword}',
        'admin',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'admin',
        is_active = true;
    `);

    console.log('✅ Admin 用户创建成功！\n');
    console.log('登录信息:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
