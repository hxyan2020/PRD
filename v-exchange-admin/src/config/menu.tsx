import type { MenuProps } from 'antd'
import {
  ApiOutlined,
  AppstoreOutlined,
  DollarOutlined,
  FileTextOutlined,
  LineChartOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
  WarningOutlined,
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
  | 'active-order'
  | 'trigger-order'
  | 'stop-order'
  | 'active-order-history-deal'
  | 'trigger-order-history-deal'
  | 'liquidate-history'
  | 'adl-history'
  | 'stop-order-history-deal'
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
  | 'openapi-mm-blacklist'
  | 'financial-report'
  | 'transfer-record'
  | 'financial-account'
  | 'financial-recon'
  | 'finance-flow'
  | 'api-manage'
  | 'tools-close-position'
  | 'tools-global-frequency'
  | 'tools-open-bottom-position'
  | 'risk-funding-fee-change'
  | 'risk-liquidation-switch'
  | 'risk-market-price-limit'
  | 'risk-reserve-list'
  | 'risk-reserve-detail'
  | 'risk-trading-restriction'

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
  'active-order': 'Active Order',
  'trigger-order': 'Trigger Order',
  'stop-order': 'Stop Order',
  'active-order-history-deal': 'Active Order History Deal',
  'trigger-order-history-deal': 'Trigger Order History Deal',
  'liquidate-history': 'Liquidate History',
  'adl-history': 'ADL History',
  'stop-order-history-deal': 'Stop Order History Deal',
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
  'openapi-mm-blacklist': 'OpenApi MM Blacklist',
  'financial-report': 'Financial Report',
  'transfer-record': 'Transfer Record',
  'financial-account': 'Financial Account',
  'financial-recon': 'Financial Reconciliation',
  'finance-flow': 'FinanceFlow',
  'api-manage': 'API Management',
  'tools-close-position': 'Close Position',
  'tools-global-frequency': 'Global Frequency',
  'tools-open-bottom-position': 'Open Bottom Position',
  'risk-funding-fee-change': 'Funding Fee Change',
  'risk-liquidation-switch': 'Liquidation Switch',
  'risk-market-price-limit': 'Market Price Limit',
  'risk-reserve-list': 'Risk Reserve List',
  'risk-reserve-detail': 'Risk Reserve Detail',
  'risk-trading-restriction': 'Trading Restriction',
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
      {
        key: 'order-list-group',
        label: 'Order List',
        children: [
          { key: 'active-order', label: 'Active Order' },
          { key: 'trigger-order', label: 'Trigger Order' },
          { key: 'stop-order', label: 'Stop Order' },
        ],
      },
      {
        key: 'deal-list-group',
        label: 'Deal List',
        children: [
          { key: 'active-order-history-deal', label: 'Active Order History Deal' },
          { key: 'trigger-order-history-deal', label: 'Trigger Order History Deal' },
          { key: 'liquidate-history', label: 'Liquidate History' },
          { key: 'adl-history', label: 'ADL History' },
          { key: 'stop-order-history-deal', label: 'Stop Order History Deal' },
        ],
      },
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
      { key: 'openapi-mm-blacklist', label: 'OpenApi MM Blacklist' },
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
  {
    key: 'api-mgmt',
    icon: <ApiOutlined />,
    label: 'API Management',
    children: [{ key: 'api-manage', label: 'API Management' }],
  },
  {
    key: 'tools-mgmt',
    icon: <ToolOutlined />,
    label: 'Tools Management',
    children: [
      { key: 'tools-close-position', label: 'Close Position' },
      { key: 'tools-global-frequency', label: 'Global Frequency' },
      { key: 'tools-open-bottom-position', label: 'Open Bottom Position' },
    ],
  },
  {
    key: 'risk-monitor',
    icon: <WarningOutlined />,
    label: 'Risk Monitor',
    children: [
      { key: 'risk-funding-fee-change', label: 'Funding Fee Change' },
      { key: 'risk-liquidation-switch', label: 'Liquidation Switch' },
      { key: 'risk-market-price-limit', label: 'Market Price Limit' },
      { key: 'risk-reserve-list', label: 'Risk Reserve List' },
      { key: 'risk-reserve-detail', label: 'Risk Reserve Detail' },
      { key: 'risk-trading-restriction', label: 'Trading Restriction' },
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
  'order-list-group',
  'deal-list-group',
  'user-mgmt',
  'contract-config',
  'financial-mgmt',
  'api-mgmt',
  'tools-mgmt',
  'risk-monitor',
]
