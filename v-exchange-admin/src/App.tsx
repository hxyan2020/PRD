import { ConfigProvider } from 'antd';
import { LocaleProvider, useLocale } from './i18n/locale';
import { MainLayout } from './layouts/MainLayout';

function AppShell() {
  const { antdLocale } = useLocale();
  return (
    <ConfigProvider
      locale={antdLocale}
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

function App() {
  return (
    <LocaleProvider>
      <AppShell />
    </LocaleProvider>
  );
}

export default App;
