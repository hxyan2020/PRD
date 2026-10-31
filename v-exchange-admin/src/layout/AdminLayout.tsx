import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Drawer, Grid, Layout, Menu, Segmented, Tabs, Typography } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  defaultOpenKeys,
  isPageKey,
  pageLabels,
  sideMenuItems,
  type PageKey,
} from '../config/menu'
import { useLocale } from '../i18n/LocaleContext'
import type { UiLang } from '../i18n/financeTerms'
import './AdminLayout.css'

const { Header, Sider, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

function pathToKey(pathname: string): PageKey {
  const segment = pathname.replace(/^\//, '') || 'overview'
  return isPageKey(segment) ? segment : 'overview'
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeKey = pathToKey(location.pathname)
  const { lang, setLang, label } = useLocale()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys)
  const [tabs, setTabs] = useState<PageKey[]>(['overview'])

  useEffect(() => {
    setTabs((prev) => (prev.includes(activeKey) ? prev : [...prev, activeKey]))
  }, [activeKey])

  useEffect(() => {
    if (!isMobile) setMobileOpen(false)
    else setOpenKeys([])
  }, [isMobile])

  const ensureTab = useCallback(
    (key: PageKey) => {
      setTabs((prev) => (prev.includes(key) ? prev : [...prev, key]))
      navigate(`/${key}`)
    },
    [navigate],
  )

  const onMenuClick = ({ key }: { key: string }) => {
    if (!isPageKey(key)) return
    ensureTab(key)
    if (isMobile) setMobileOpen(false)
  }

  const onTabChange = (key: string) => {
    if (isPageKey(key)) navigate(`/${key}`)
  }

  const onTabEdit = (
    targetKey: string | React.MouseEvent | React.KeyboardEvent,
    action: 'add' | 'remove',
  ) => {
    if (action !== 'remove' || typeof targetKey !== 'string' || !isPageKey(targetKey)) return
    if (targetKey === 'overview') return

    setTabs((prev) => {
      const next = prev.filter((k) => k !== targetKey)
      if (activeKey === targetKey) {
        const fallback = next[next.length - 1] ?? 'overview'
        navigate(`/${fallback}`)
      }
      return next.length ? next : ['overview']
    })
  }

  const tabItems = useMemo(
    () =>
      tabs.map((key) => ({
        key,
        label: label(pageLabels[key]),
        closable: key !== 'overview',
      })),
    [tabs, label],
  )

  const menuItems = useMemo(() => {
    const mapItems = (items: typeof sideMenuItems): typeof sideMenuItems =>
      (items || []).map((item) => {
        if (!item || typeof item !== 'object') return item
        const next = { ...item } as {
          key?: string
          label?: unknown
          children?: typeof sideMenuItems
        }
        if (typeof next.label === 'string') next.label = label(next.label)
        if (next.children) next.children = mapItems(next.children)
        return next
      }) as typeof sideMenuItems
    return mapItems(sideMenuItems)
  }, [label])

  const sideMenu = (
    <>
      <div className="admin-brand">
        <Text strong className="admin-brand-title">
          {collapsed && !isMobile ? 'MM' : 'MatchingManagement'}
        </Text>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        openKeys={collapsed && !isMobile ? [] : openKeys}
        onOpenChange={setOpenKeys}
        items={menuItems}
        onClick={onMenuClick}
      />
    </>
  )

  return (
    <Layout className={`admin-root${isMobile ? ' admin-root--mobile' : ''}`}>
      {!isMobile && (
        <Sider
          className="admin-sider"
          width={240}
          collapsible
          collapsed={collapsed}
          trigger={null}
          theme="light"
        >
          {sideMenu}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          className="admin-mobile-drawer"
          placement="left"
          width={280}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          styles={{ body: { padding: 0 } }}
          title="MatchingManagement"
        >
          {sideMenu}
        </Drawer>
      )}

      <Layout className="admin-main">
        <Header className="admin-header">
          <button
            type="button"
            className="admin-collapse-btn"
            onClick={() => (isMobile ? setMobileOpen((o) => !o) : setCollapsed((c) => !c))}
            aria-label="Toggle menu"
          >
            {isMobile ? (
              mobileOpen ? (
                <MenuFoldOutlined />
              ) : (
                <MenuUnfoldOutlined />
              )
            ) : collapsed ? (
              <MenuUnfoldOutlined />
            ) : (
              <MenuFoldOutlined />
            )}
          </button>
          <div className="admin-header-right">
            <Segmented<UiLang>
              size="small"
              className="admin-lang-switch"
              value={lang}
              onChange={(v) => setLang(v)}
              options={[
                { label: '中文', value: 'zh' },
                { label: 'EN', value: 'en' },
                { label: '中英', value: 'both' },
              ]}
              aria-label="UI language"
            />
            <Avatar size="small" icon={<UserOutlined />} />
            {!isMobile && <Text className="admin-user-name">Haixiang Yan</Text>}
          </div>
        </Header>
        <Content className="admin-content">
          <Tabs
            type="editable-card"
            hideAdd
            size="small"
            className="admin-tabs"
            activeKey={activeKey}
            items={tabItems}
            onChange={onTabChange}
            onEdit={onTabEdit}
          />
          <div className="admin-page-host">
            <Outlet context={{ activeKey }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
