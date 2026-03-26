import React from 'react';
import { Typography, Tabs, Card, Divider, List } from 'antd';
import { RocketOutlined, BuildOutlined, KeyOutlined, SettingOutlined } from '@ant-design/icons';

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
 </Tabs>
 </div>
 );
};

export default TutorialPage;
