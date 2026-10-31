import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Tabs, theme, Typography } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { renderPage } from '../components/PageRegistry';
import { isPageKey, pageTitles, sideMenuItems, type PageKey } from '../config/menu';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const defaultOpenKeys = [
  'contract-manage',
  'price-manage',
  'order-manage',
  'user-manage',
  'contract-config',
  'risk-manage',
  'monitor-alert',
];

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys);
  const [tabs, setTabs] = useState<PageKey[]>(['overview']);
  const [activeKey, setActiveKey] = useState<PageKey>('overview');
  const {
    token: { colorBgContainer, colorBorderSecondary },
  } = theme.useToken();

  const openPage = useCallback((key: PageKey) => {
    setTabs((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setActiveKey(key);
  }, []);

  const onMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (!isPageKey(key)) return;
      openPage(key);
    },
    [openPage],
  );

  const onTabChange = (key: string) => {
    if (isPageKey(key)) setActiveKey(key);
  };

  const onTabEdit = (targetKey: React.Key | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
    if (action !== 'remove' || typeof targetKey !== 'string' || !isPageKey(targetKey)) return;
    if (tabs.length <= 1) return;
    const key = targetKey as PageKey;
    setTabs((prev) => {
      const next = prev.filter((t) => t !== key);
      if (activeKey === key) {
        setActiveKey(next[next.length - 1] ?? 'overview');
      }
      return next;
    });
  };

  const selectedKeys = useMemo(() => [activeKey], [activeKey]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: '#fff', borderRight: `1px solid ${colorBorderSecondary}` }}
      >
        <div className="brand-title">{collapsed ? 'MM' : 'MatchingManagement'}</div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setOpenKeys}
          items={sideMenuItems}
          onClick={onMenuClick}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            borderBottom: `1px solid ${colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
            lineHeight: '48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Text type="secondary">{pageTitles[activeKey]}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>Haixiang Yan</Text>
          </div>
        </Header>
        <Content style={{ padding: 0, background: '#f5f5f5' }}>
          <div style={{ background: colorBgContainer, borderBottom: `1px solid ${colorBorderSecondary}` }}>
            <Tabs
              type="editable-card"
              hideAdd
              activeKey={activeKey}
              onChange={onTabChange}
              onEdit={onTabEdit}
              items={tabs.map((key) => ({
                key,
                label: pageTitles[key],
                closable: tabs.length > 1,
              }))}
              className="admin-top-tabs"
              style={{ margin: 0, padding: '0 8px' }}
            />
          </div>
          <div className="admin-tab-content">{renderPage(activeKey)}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
