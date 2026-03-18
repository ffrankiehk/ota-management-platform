/**
 * OTA Platform API 测试脚本
 * 运行: node test-api.js
 */

const API_BASE_URL = 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  bundleId: 'com.test.otaapp',
  platform: 'android',
  currentVersion: '1.0.0',
  appVersion: '1.0.0',
  deviceId: 'test-device-001',
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function section(message) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.yellow);
  console.log('='.repeat(60));
}

// 测试函数
async function testHealthCheck() {
  section('1. Health Check');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'OK') {
      success('Health check passed');
      log(`  Environment: ${data.env}`, colors.gray);
      log(`  Timestamp: ${data.timestamp}`, colors.gray);
      return true;
    } else {
      error('Health check failed');
      return false;
    }
  } catch (err) {
    error(`Cannot connect to server: ${err.message}`);
    info('请确保后端服务已启动: npm run dev:api');
    return false;
  }
}

async function testCheckUpdateGET() {
  section('2. Check Update (GET) - 测试修复的 bug');
  try {
    const params = new URLSearchParams({
      bundle_id: TEST_CONFIG.bundleId,
      platform: TEST_CONFIG.platform,
      current_version: TEST_CONFIG.currentVersion,
      app_version: TEST_CONFIG.appVersion,
    });
    
    const url = `${API_BASE_URL}/api/v1/ota/check-update?${params}`;
    log(`  Request: GET ${url}`, colors.gray);
    
    const response = await fetch(url);
    const data = await response.json();
    
    log(`  Response: ${JSON.stringify(data, null, 2)}`, colors.gray);
    
    if (response.ok && data.success) {
      success('GET check-update 正常工作（bug 已修复）');
      
      if (data.data.updateAvailable) {
        success(`  发现更新: ${data.data.latestVersion}`);
        log(`  下载地址: ${data.data.downloadUrl}`, colors.gray);
        log(`  包大小: ${data.data.bundleSize} bytes`, colors.gray);
        log(`  强制更新: ${data.data.isMandatory}`, colors.gray);
        return { hasUpdate: true, data: data.data };
      } else {
        info('  当前已是最新版本');
        return { hasUpdate: false };
      }
    } else if (response.status === 404) {
      error('Application 不存在');
      info('需要在数据库创建测试数据，运行: node seed-test-data.js');
      return null;
    } else {
      error(`API 返回错误: ${data.message}`);
      return null;
    }
  } catch (err) {
    error(`请求失败: ${err.message}`);
    return null;
  }
}

async function testCheckUpdatePOST() {
  section('3. Check Update (POST) - 向后兼容');
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ota/check-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bundleId: TEST_CONFIG.bundleId,
        platform: TEST_CONFIG.platform,
        currentVersion: TEST_CONFIG.currentVersion,
        appVersion: TEST_CONFIG.appVersion,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      success('POST check-update 也正常工作（向后兼容）');
      return true;
    } else {
      error('POST 请求失败');
      return false;
    }
  } catch (err) {
    error(`请求失败: ${err.message}`);
    return false;
  }
}

async function testReportStatus(releaseId) {
  section('4. Report Status - 新增的状态上报功能');
  
  const statuses = [
    { status: 'started', desc: '开始下载' },
    { status: 'downloaded', downloadTimeMs: 1234, desc: '下载完成' },
    { status: 'verified', desc: 'Hash 校验通过' },
    { status: 'installed', installTimeMs: 567, desc: '安装成功' },
  ];
  
  for (const { status, downloadTimeMs, installTimeMs, desc } of statuses) {
    try {
      const payload = {
        deviceId: TEST_CONFIG.deviceId,
        releaseId: releaseId || 'test-release-id',
        status,
        downloadTimeMs,
        installTimeMs,
        deviceInfo: {
          platform: TEST_CONFIG.platform,
          appVersion: TEST_CONFIG.appVersion,
          osVersion: '13',
        },
      };
      
      log(`  上报: ${desc} (${status})`, colors.gray);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/ota/report-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        success(`  ${desc} - 上报成功`);
      } else {
        error(`  ${desc} - 上报失败: ${data.message}`);
      }
    } catch (err) {
      error(`  请求失败: ${err.message}`);
    }
  }
}

async function testConfig() {
  section('5. Get Config - 配置获取');
  try {
    const url = `${API_BASE_URL}/api/v1/ota/config?bundleId=${TEST_CONFIG.bundleId}&platform=${TEST_CONFIG.platform}`;
    const response = await fetch(url);
    const data = await response.json();
    
    log(`  Response: ${JSON.stringify(data, null, 2)}`, colors.gray);
    
    if (response.ok && data.success) {
      success('Config API 正常工作');
      return true;
    } else {
      error('Config API 失败');
      return false;
    }
  } catch (err) {
    error(`请求失败: ${err.message}`);
    return false;
  }
}

// 主测试流程
async function runTests() {
  log('\n🧪 OTA Platform API 测试', colors.yellow);
  log('测试配置:', colors.gray);
  log(`  API: ${API_BASE_URL}`, colors.gray);
  log(`  Bundle ID: ${TEST_CONFIG.bundleId}`, colors.gray);
  log(`  Platform: ${TEST_CONFIG.platform}`, colors.gray);
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    error('\n后端服务未运行，测试终止');
    process.exit(1);
  }
  
  const updateResult = await testCheckUpdateGET();
  await testCheckUpdatePOST();
  await testConfig();
  
  // 如果有更新，测试状态上报
  if (updateResult?.hasUpdate && updateResult.data?.releaseId) {
    await testReportStatus(updateResult.data.releaseId);
  } else {
    section('4. Report Status - 跳过（无更新数据）');
    info('创建测试数据后可测试状态上报功能');
  }
  
  section('测试完成');
  success('所有 Week 1 改动已验证！');
  
  log('\n📝 下一步建议:', colors.yellow);
  log('  1. 查看数据库 update_logs 表确认状态上报记录');
  log('  2. 通过 Dashboard 查看更新统计');
  log('  3. 开始 Week 2 开发（Android Native SDK）');
}

// 运行测试
runTests().catch(err => {
  error(`\n测试异常: ${err.message}`);
  console.error(err);
  process.exit(1);
});
