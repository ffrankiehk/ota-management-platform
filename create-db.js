/**
 * 创建 ota_platform 数据库
 */
const { Client } = require('pg');

async function createDatabase() {
  console.log('🔨 创建 ota_platform 数据库...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ff906114',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ 连接到 PostgreSQL\n');

    // 检查数据库是否已存在
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ota_platform'"
    );

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  ota_platform 数据库已存在');
      return;
    }

    // 创建数据库
    await client.query('CREATE DATABASE ota_platform');
    console.log('✅ ota_platform 数据库创建成功！\n');
    
    console.log('📝 下一步:');
    console.log('   cd packages\\api');
    console.log('   npm run migrate');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
