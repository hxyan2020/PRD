import { ConfigProvider } from 'antd';
import { MainLayout } from './layouts/MainLayout';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 4,
          fontSize: 13,
        },
      }}
    >
      <MainLayout />
    </ConfigProvider>
  );
}

export default App;
