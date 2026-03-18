/**
 * 创建测试数据脚本
 * 运行: node seed-test-data.js
 */

const { Sequelize } = require('sequelize');
const crypto = require('crypto');
require('dotenv').config();

// 数据库配置（从 .env 读取）
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ff906114@localhost:5432/ota_platform';

const sequelize = new Sequelize(DATABASE_URL, {
  logging: false,
  dialectOptions: {
    ssl: false,
  },
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function seedData() {
  try {
    await sequelize.authenticate();
    log('✅ 数据库连接成功', colors.green);
    
    // 1. 创建 Organization
    log('\n📦 创建测试 Organization...', colors.blue);
    
    // 先检查是否存在
    const [existingOrg] = await sequelize.query(`
      SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1;
    `);
    
    let orgId;
    if (existingOrg.length > 0) {
      orgId = existingOrg[0].id;
      log(`  ℹ️  Organization 已存在: ${orgId}`, colors.yellow);
    } else {
      const [orgRows] = await sequelize.query(`
        INSERT INTO organizations (id, name, slug, api_key, created_at, updated_at)
        VALUES (
          gen_random_uuid(), 
          'Test Organization', 
          'test-organization',
          'test_' || substring(md5(random()::text) from 1 for 32),
          NOW(), 
          NOW()
        )
        RETURNING id;
      `);
      orgId = orgRows[0].id;
      log(`  ✅ Organization 创建成功: ${orgId}`, colors.green);
    }
    
    // 2. 创建 Application
    log('\n📱 创建测试 Application...', colors.blue);
    
    const [existingApp] = await sequelize.query(`
      SELECT id FROM applications WHERE bundle_id = 'com.test.otaapp' AND platform = 'android' LIMIT 1;
    `);
    
    let appId;
    if (existingApp.length > 0) {
      appId = existingApp[0].id;
      log(`  ℹ️  Application 已存在: ${appId}`, colors.yellow);
    } else {
      const [appRows] = await sequelize.query(`
        INSERT INTO applications (id, organization_id, name, bundle_id, platform, current_version, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), '${orgId}', 'Test OTA App', 'com.test.otaapp', 'android', '1.0.0', true, NOW(), NOW())
        RETURNING id;
      `);
      appId = appRows[0].id;
      log(`  ✅ Application 创建成功: ${appId}`, colors.green);
    }
    log('    Bundle ID: com.test.otaapp', colors.green);
    log('    Platform: android', colors.green);
    
    // 3. 创建模拟的 bundle 文件信息
    const bundleData = JSON.stringify({ test: 'bundle', version: '1.0.1' });
    const bundleHash = crypto.createHash('sha256').update(bundleData).digest('hex');
    const bundleSize = Buffer.byteLength(bundleData);
    
    // 4. 创建 Release
    log('\n📦 创建测试 Release...', colors.blue);
    
    const [existingRelease] = await sequelize.query(`
      SELECT id FROM releases WHERE application_id = '${appId}' AND version = '1.0.1' LIMIT 1;
    `);
    
    if (existingRelease.length > 0) {
      await sequelize.query(`
        UPDATE releases SET status = 'active' WHERE id = '${existingRelease[0].id}';
      `);
      log(`  ℹ️  Release 已存在，状态已更新为 active`, colors.yellow);
    } else {
      await sequelize.query(`
        INSERT INTO releases (
          id, application_id, version, build_number, bundle_url, bundle_hash, bundle_size,
          bundle_type, target_platform, release_notes, rollout_percentage, is_mandatory,
          status, released_at, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), '${appId}', '1.0.1', 2, 'http://localhost:3000/uploads/test-bundle.zip',
          '${bundleHash}', ${bundleSize}, 'js-bundle', 'react-native',
          '测试更新：修复了若干 bug，提升了性能', 100, false, 'active', NOW(), NOW(), NOW()
        );
      `);
      log('  ✅ Release 创建成功', colors.green);
    }
    
    log('  ✅ Release 创建成功', colors.green);
    log('    Version: 1.0.1', colors.green);
    log('    Bundle Hash: ' + bundleHash.substring(0, 16) + '...', colors.green);
    log('    Status: active', colors.green);
    
    // 5. 创建 User (用于 Dashboard 登录)
    log('\n👤 创建测试 User...', colors.blue);
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123456', 10);
    
    await sequelize.query(`
      INSERT INTO users (id, organization_id, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        '${orgId}',
        'test@example.com',
        '${hashedPassword}',
        'admin',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);
    
    log('  ✅ User 创建成功', colors.green);
    log('    Email: test@example.com', colors.green);
    log('    Password: test123456', colors.green);
    
    log('\n✅ 测试数据创建完成！', colors.green);
    log('\n📝 测试信息摘要:', colors.yellow);
    log('─'.repeat(60));
    log(`  Organization ID: ${orgId}`);
    log(`  Application ID:  ${appId}`);
    log('  Bundle ID:       com.test.otaapp');
    log('  Platform:        android');
    log('  Current Version: 1.0.0');
    log('  Latest Version:  1.0.1');
    log('  Release Status:  active');
    log('─'.repeat(60));
    log('\n🚀 现在可以运行测试: node test-api.js', colors.blue);
    
  } catch (error) {
    log('\n❌ 错误: ' + error.message, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedData();
