/**
 * 检查 PostgreSQL 数据库
 */
const { Client } = require('pg');

async function checkDatabase() {
  console.log('🔍 检查 PostgreSQL 连接...\n');
  
  // 先连接到默认的 postgres 数据库
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ff906114',
    database: 'postgres', // 连接到默认数据库
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 连接成功\n');

    // 查询所有数据库
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
    );

    console.log('📊 现有数据库列表:');
    console.log('─'.repeat(40));
    const databases = result.rows.map(row => row.datname);
    databases.forEach(db => {
      const isOTA = db === 'ota_platform';
      console.log(`${isOTA ? '🎯' : '  '} ${db}`);
    });
    console.log('─'.repeat(40));

    const hasOTA = databases.includes('ota_platform');
    
    if (hasOTA) {
      console.log('\n✅ ota_platform 数据库存在');
      
      // 连接到 ota_platform 检查表
      await client.end();
      
      const otaClient = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'ff906114',
        database: 'ota_platform',
      });
      
      await otaClient.connect();
      
      const tables = await otaClient.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `);
      
      console.log('\n📋 ota_platform 中的表:');
      console.log('─'.repeat(40));
      if (tables.rows.length === 0) {
        console.log('  (空 - 需要运行 migration)');
      } else {
        tables.rows.forEach(row => {
          console.log(`  ✓ ${row.tablename}`);
        });
      }
      console.log('─'.repeat(40));
      
      await otaClient.end();
      
    } else {
      console.log('\n❌ ota_platform 数据库不存在');
      console.log('\n💡 需要创建数据库，运行以下命令:');
      console.log('   node create-db.js');
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL 服务未运行，请先启动 PostgreSQL');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 密码错误，请检查 .env 中的 DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    if (client._connected) {
      await client.end();
    }
  }
}

checkDatabase();
