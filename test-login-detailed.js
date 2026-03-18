/**
 * 详细测试登录流程
 */
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function testLogin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ff906114',
    database: 'ota_platform',
  });

  try {
    await client.connect();
    
    console.log('🔐 测试登录流程\n');
    
    // 1. 查找用户
    const userResult = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.role,
        u.is_active,
        u.organization_id,
        o.id as org_id,
        o.name as org_name,
        o.slug as org_slug
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = 'admin@example.com' AND u.is_active = true;
    `);

    console.log('1️⃣ 查找用户:');
    if (userResult.rows.length === 0) {
      console.log('   ❌ 用户不存在或未激活\n');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('   ✅ 找到用户');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.is_active);
    console.log('   Organization ID:', user.organization_id);
    console.log('   Organization:', user.org_name || 'NULL');
    console.log();

    // 2. 验证密码
    console.log('2️⃣ 验证密码:');
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`   Password "${testPassword}": ${isValid ? '✅ 正确' : '❌ 错误'}`);
    console.log();

    // 3. 检查 Organization
    console.log('3️⃣ 检查 Organization:');
    if (!user.org_id) {
      console.log('   ⚠️  用户没有关联的 Organization！');
      console.log('   这可能导致登录失败（如果代码要求必须有 organization）\n');
    } else {
      console.log('   ✅ Organization 数据正常');
      console.log('   ID:', user.org_id);
      console.log('   Name:', user.org_name);
      console.log('   Slug:', user.org_slug);
      console.log();
    }

    console.log('✅ 数据库检查完成');
    console.log('\n如果上述所有检查都通过，登录应该能成功。');
    console.log('如果仍然失败，问题可能在于 Sequelize 模型关联配置。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

testLogin();
