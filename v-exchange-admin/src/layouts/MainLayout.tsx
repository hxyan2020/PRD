import {
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Grid, Layout, Menu, Tabs, theme, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  'mm-manage',
];

export function MainLayout() {
  const screens = Grid.useBreakpoint();
  // Treat unresolved breakpoints as desktop to avoid a sider flash on first paint.
  const isMobile = screens.md === false;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys);
  const [tabs, setTabs] = useState<PageKey[]>(['overview']);
  const [activeKey, setActiveKey] = useState<PageKey>('overview');
  const {
    token: { colorBgContainer, colorBorderSecondary },
  } = theme.useToken();

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
      setOpenKeys((prev) => (prev.length ? prev : defaultOpenKeys));
      return;
    }
    // On phones, keep submenu groups collapsed so the drawer stays scannable.
    setOpenKeys([]);
  }, [isMobile]);

  const openPage = useCallback((key: PageKey) => {
    setTabs((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setActiveKey(key);
  }, []);

  const onMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (!isPageKey(key)) return;
      openPage(key);
      if (isMobile) setMobileMenuOpen(false);
    },
    [openPage, isMobile],
  );

  const onTabChange = (key: string) => {
    if (isPageKey(key)) setActiveKey(key);
  };

  const onTabEdit = (
    targetKey: React.Key | React.MouseEvent | React.KeyboardEvent,
    action: 'add' | 'remove',
  ) => {
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

  const sideMenu = (
    <Menu
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={collapsed && !isMobile ? [] : openKeys}
      onOpenChange={setOpenKeys}
      items={sideMenuItems}
      onClick={onMenuClick}
      style={{ borderInlineEnd: 'none' }}
    />
  );

  return (
    <Layout className={isMobile ? 'admin-layout admin-layout--mobile' : 'admin-layout'} style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={220}
          style={{ background: '#fff', borderRight: `1px solid ${colorBorderSecondary}` }}
        >
          <div className="brand-title">{collapsed ? 'MM' : 'MatchingManagement'}</div>
          {sideMenu}
        </Sider>
      )}

      <Drawer
        title="MatchingManagement"
        placement="left"
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width={280}
        styles={{ body: { padding: 0 } }}
        className="admin-mobile-drawer"
        destroyOnClose={false}
      >
        {sideMenu}
      </Drawer>

      <Layout className="admin-main">
        <Header
          className="admin-header"
          style={{
            padding: isMobile ? '0 8px 0 4px' : '0 16px',
            background: colorBgContainer,
            borderBottom: `1px solid ${colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
            lineHeight: '48px',
          }}
        >
          <div className="admin-header-left">
            <Button
              type="text"
              aria-label={isMobile ? '打开菜单' : collapsed ? '展开侧栏' : '收起侧栏'}
              icon={
                isMobile ? (
                  <MenuOutlined />
                ) : collapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={() => {
                if (isMobile) setMobileMenuOpen((v) => !v);
                else setCollapsed((v) => !v);
              }}
            />
            <Text type="secondary" className="admin-header-title" ellipsis>
              {pageTitles[activeKey]}
            </Text>
          </div>
          <div className="admin-header-right">
            <Avatar size="small" icon={<UserOutlined />} />
            {!isMobile && <Text>Haixiang Yan</Text>}
          </div>
        </Header>
        <Content style={{ padding: 0, background: '#f5f5f5' }}>
          <div
            className="admin-tabs-wrap"
            style={{ background: colorBgContainer, borderBottom: `1px solid ${colorBorderSecondary}` }}
          >
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
              style={{ margin: 0, padding: isMobile ? '0 4px' : '0 8px' }}
            />
          </div>
          <div className="admin-tab-content">{renderPage(activeKey)}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
