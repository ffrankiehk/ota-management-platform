const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🔐 测试登录 API...\n');
    
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
      }),
    });

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    
    const data = await response.json();
    console.log('\n响应:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ 登录成功！');
      console.log('Token:', data.token?.substring(0, 50) + '...');
    } else {
      console.log('\n❌ 登录失败');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

testLogin();
