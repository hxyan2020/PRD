import type { MenuProps } from 'antd'
import {
  AppstoreOutlined,
  DollarOutlined,
  FileTextOutlined,
  LineChartOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons'

export type PageKey =
  | 'overview'
  | 'contract-list'
  | 'coin-introduce'
  | 'funding-fee-list'
  | 'kline-manage'
  | 'trade-amount-factor'
  | 'admin-adl'
  | 'market-source'
  | 'index-price'
  | 'fair-price'
  | 'index-market-link'
  | 'funding-rate'
  | 'position-list'
  | 'position-value-stats'
  | 'order-list'
  | 'deal-list'
  | 'user-asset'
  | 'user-rate-config'
  | 'user-info'
  | 'user-risk-settings'
  | 'user-blacklist'
  | 'blacklist-group'
  | 'margin-change'
  | 'redis-key-manage'
  | 'redis-value-manage'
  | 'openapi-whitelist'
  | 'openapi-market'
  | 'financial-report'
  | 'transfer-record'
  | 'financial-account'
  | 'financial-recon'
  | 'finance-flow'

export const pageLabels: Record<PageKey, string> = {
  overview: 'Overview',
  'contract-list': 'Contract List',
  'coin-introduce': 'Coin Introduce',
  'funding-fee-list': 'Funding Fee List',
  'kline-manage': 'KLine Manage',
  'trade-amount-factor': 'Trade Amount Factor Config',
  'admin-adl': 'Admin Adl',
  'market-source': 'Market Source',
  'index-price': 'Index Price',
  'fair-price': 'Fair Price',
  'index-market-link': 'Index Market Link',
  'funding-rate': 'Funding Rate',
  'position-list': 'Position List',
  'position-value-stats': 'Position Value Statistics',
  'order-list': 'Order List',
  'deal-list': 'Deal List',
  'user-asset': 'User Asset',
  'user-rate-config': 'User Rate Configuration',
  'user-info': 'User Info',
  'user-risk-settings': 'User Risk Settings',
  'user-blacklist': 'User Blacklist',
  'blacklist-group': 'Blacklist Group',
  'margin-change': 'Margin Change',
  'redis-key-manage': 'Redis Key Management',
  'redis-value-manage': 'Redis Value Management',
  'openapi-whitelist': 'OpenApi White List',
  'openapi-market': 'OpenApi Market',
  'financial-report': 'Financial Report',
  'transfer-record': 'Transfer Record',
  'financial-account': 'Financial Account',
  'financial-recon': 'Financial Reconciliation',
  'finance-flow': 'FinanceFlow',
}

export const sideMenuItems: MenuProps['items'] = [
  {
    key: 'overview',
    icon: <AppstoreOutlined />,
    label: 'Overview',
  },
  {
    key: 'contract-mgmt',
    icon: <FileTextOutlined />,
    label: 'Contract Management',
    children: [
      { key: 'contract-list', label: 'Contract List' },
      { key: 'coin-introduce', label: 'Coin Introduce' },
      { key: 'funding-fee-list', label: 'Funding Fee List' },
      { key: 'kline-manage', label: 'KLine Manage' },
      { key: 'trade-amount-factor', label: 'Trade Amount Factor Config' },
      { key: 'admin-adl', label: 'Admin Adl' },
    ],
  },
  {
    key: 'price-mgmt',
    icon: <LineChartOutlined />,
    label: 'Price Management',
    children: [
      { key: 'market-source', label: 'Market Source' },
      { key: 'index-price', label: 'Index Price' },
      { key: 'fair-price', label: 'Fair Price' },
      { key: 'index-market-link', label: 'Index Market Link' },
      { key: 'funding-rate', label: 'Funding Rate' },
    ],
  },
  {
    key: 'order-mgmt',
    icon: <ShoppingOutlined />,
    label: 'Order Management',
    children: [
      { key: 'position-list', label: 'Position List' },
      { key: 'position-value-stats', label: 'Position Value Statistics' },
      { key: 'order-list', label: 'Order List' },
      { key: 'deal-list', label: 'Deal List' },
    ],
  },
  {
    key: 'user-mgmt',
    icon: <TeamOutlined />,
    label: 'User Management',
    children: [
      { key: 'user-asset', label: 'User Asset' },
      { key: 'user-rate-config', label: 'User Rate Configuration' },
      { key: 'user-info', label: 'User Info' },
      { key: 'user-risk-settings', label: 'User Risk Settings' },
      { key: 'user-blacklist', label: 'User Blacklist' },
      { key: 'blacklist-group', label: 'Blacklist Group' },
      { key: 'margin-change', label: 'Margin Change' },
    ],
  },
  {
    key: 'contract-config',
    icon: <SettingOutlined />,
    label: 'Contract Configuration',
    children: [
      { key: 'redis-key-manage', label: 'Redis Key Management' },
      { key: 'redis-value-manage', label: 'Redis Value Management' },
      { key: 'openapi-whitelist', label: 'OpenApi White List' },
      { key: 'openapi-market', label: 'OpenApi Market' },
    ],
  },
  {
    key: 'financial-mgmt',
    icon: <DollarOutlined />,
    label: 'Financial Management',
    children: [
      { key: 'financial-report', label: 'Financial Report' },
      { key: 'transfer-record', label: 'Transfer Record' },
      { key: 'financial-account', label: 'Financial Account' },
      { key: 'financial-recon', label: 'Financial Reconciliation' },
      { key: 'finance-flow', label: 'FinanceFlow' },
    ],
  },
]

export function isPageKey(key: string): key is PageKey {
  return key in pageLabels
}

export const defaultOpenKeys = [
  'contract-mgmt',
  'price-mgmt',
  'order-mgmt',
  'user-mgmt',
  'contract-config',
  'financial-mgmt',
]
