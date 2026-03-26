import React from 'react';
import { Typography, Tabs, Card, Divider, List } from 'antd';
import { RocketOutlined, BuildOutlined, KeyOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const TutorialPage: React.FC = () => {
  const sdkIntegrationCode = '// 引入 OTA 頭文件\n#import <OTA/OTAManager.h>\n\n- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {\n#if DEBUG\n  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@" index\];\n#else\n return [OTAManager getBundleURL];\n#endif\n}';
 
 const apiConfigCode = 'const OTA_CONFIG = {\n apiUrl: \https://ota.2maru.com\,\n apiKey: \YOUR_API_KEY\,\n bundleId: \com.aberdeenmarinaclub.amc\,\n platform: Platform.OS,\n};';

 return (
 <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
 <Title level={2}>教學中心 (Tutorial Center)</Title>
 <Paragraph>
 本教學將引導您如何將 OTA 功能整合到您的應用程式中。
 </Paragraph>

 <Tabs defaultActiveKey='1' type='card' size='large'>
 <Tabs.TabPane tab={<span><SettingOutlined /> 1. SDK 整合</span>} key='1'>
 <Card title='第一步：安裝 npm 依賴'>
 <Paragraph>在專案根目錄執行：</Paragraph>
 <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', fontFamily: 'monospace' }}>
 npm install react-native-ota-hot-update react-native-blob-util
 </div>
 <Divider />
 <Title level={4}>第二步：iOS 原生配置 (AppDelegate.mm)</Title>
 <div style={{ background: '#2d2d2d', padding: '16px', borderRadius: '4px', color: '#f8f8f2' }}>
 <pre style={{ margin: 0 }}>{sdkIntegrationCode}</pre>
 </div>
 </Card>
 </Tabs.TabPane>

 <Tabs.TabPane tab={<span><KeyOutlined /> 2. API 配置</span>} key='2'>
 <Card title='配置 otaService.ts'>
 <div style={{ background: '#2d2d2d', padding: '16px', borderRadius: '4px', color: '#f8f8f2' }}>
 <pre style={{ margin: 0 }}>{apiConfigCode}</pre>
 </div>
 </Card>
 </Tabs.TabPane>

 <Tabs.TabPane tab={<span><BuildOutlined /> 3. 製作 Bundle</span>} key='3'>
 <Card title='生成 iOS OTA Bundle'>
 <Paragraph>步驟 A：導出命令</Paragraph>
 <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', fontFamily: 'monospace' }}>
 npx expo export:embed --platform ios --entry-file node_modules/expo/AppEntry.js --bundle-output ios/main.jsbundle --dev false --assets-dest ios/assets
 </div>
 <Paragraph style={{ marginTop: '16px' }}>步驟 B：壓縮為 main.jsbundle.zip</Paragraph>
 </Card>
 </Tabs.TabPane>

 <Tabs.TabPane tab={<span><RocketOutlined /> 4. 發布更新</span>} key='4'>
 <Card title='管理平台操作'>
 <List
 dataSource={[
 '登入平台',
 '進入專案 (Applications)',
 '上傳 Zip 文件',
 '設置版本號 (如 1.0.1)',
 '發布更新'
 ]}
 renderItem={(item, index) => (
 <List.Item><Text>{index + 1}. {item}</Text></List.Item>
 )}
 />
 </Card>
 </Tabs.TabPane>

 <Tabs.TabPane tab={<span><TeamOutlined /> 5. 測試與分組</span>} key='5'>
 <Card title='內部測試流程 (Test Groups)'>
 <Title level={4}>第一步：獲取設備 ID (Device ID)</Title>
 <Paragraph>
 在應用程式啟動時，可以在開發環境的控制台 (Console Log) 中看到 <code>deviceId</code>。
 </Paragraph>
 <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: '16px' }}>
 <Text type="secondary">日誌範例：</Text>
 <code style={{ display: 'block', marginTop: '8px' }}>[OTA] Device ID: 8F67600F-XXXX-XXXX-XXXX-XXXXXXXXXXXX</code>
 </div>

 <Divider />

 <Title level={4}>第二步：建立測試分組</Title>
 <List
 dataSource={[
 '在管理平台左側選單進入 "Devices"',
 '或者進入特定專案後的 "Test Groups" 標籤',
 '點擊 "Create New Group"',
 '輸入分組名稱 (例如：Internal_Testers)',
 '在 "Devices" 欄位貼入獲取的 Device ID',
 '點擊 "Save" 保存'
 ]}
 renderItem={(item, index) => (
 <List.Item><Text>{index + 1}. {item}</Text></List.Item>
 )}
 />

 <Divider />

 <Title level={4}>第三步：定向發布更新</Title>
 <Paragraph>
 在「發布更新」的配置頁面 (Release Config) 中：
 </Paragraph>
 <List
 dataSource={[
 '尋找 "Target Audience" 或 "Push To" 選項',
 '選擇 "Specific Groups"',
 '勾選您剛建立的測試分組',
 '完成發布'
 ]}
 renderItem={(item, index) => (
 <List.Item><Text>{index + 1}. {item}</Text></List.Item>
 )}
 />
 <div style={{ marginTop: '16px', padding: '12px', background: '#fff7e6', border: '1px solid #ffe7ba', borderRadius: '4px' }}>
 <Text type="warning">提示：只有屬於該分組的設備會收到此更新，不會影響正式環境用戶。</Text>
 </div>
 </Card>
 </Tabs.TabPane>
 </Tabs>
 </div>
 );
};

export default TutorialPage;
