import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Layout, Menu, Tabs, Typography } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  defaultOpenKeys,
  isPageKey,
  pageLabels,
  sideMenuItems,
  type PageKey,
} from '../config/menu'
import './AdminLayout.css'

const { Header, Sider, Content } = Layout
const { Text } = Typography

function pathToKey(pathname: string): PageKey {
  const segment = pathname.replace(/^\//, '') || 'overview'
  return isPageKey(segment) ? segment : 'overview'
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeKey = pathToKey(location.pathname)

  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys)
  const [tabs, setTabs] = useState<PageKey[]>(['overview'])

  useEffect(() => {
    setTabs((prev) => (prev.includes(activeKey) ? prev : [...prev, activeKey]))
  }, [activeKey])

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
        label: pageLabels[key],
        closable: key !== 'overview',
      })),
    [tabs],
  )

  return (
    <Layout className="admin-root">
      <Sider
        className="admin-sider"
        width={240}
        collapsible
        collapsed={collapsed}
        trigger={null}
        theme="light"
      >
        <div className="admin-brand">
          <Text strong className="admin-brand-title">
            {collapsed ? 'MM' : 'MatchingManagement'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setOpenKeys}
          items={sideMenuItems}
          onClick={onMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <button
            type="button"
            className="admin-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle menu"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <div className="admin-header-right">
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>Haixiang Yan</Text>
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
