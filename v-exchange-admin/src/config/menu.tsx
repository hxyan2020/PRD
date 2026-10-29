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
  | 'api-open-list'
  | 'api-ratio-config'
  | 'api-user-limit-config'
  | 'api-user-taker-blacklist'
  | 'api-user-taker-config'
  | 'tools-close-position'
  | 'tools-global-frequency'
  | 'tools-open-bottom-position'
  | 'risk-funding-fee-change'
  | 'risk-liquidation-switch'
  | 'risk-market-price-limit'
  | 'risk-reserve-list'
  | 'risk-reserve-detail'
  | 'risk-trading-restriction'
  | 'risk-spread-alert'
  | 'risk-no-trade-monitor'
  | 'risk-depth-monitor'
  | 'risk-peer-spread-monitor'
  | 'risk-external-funding'
  | 'risk-internal-funding'
  | 'risk-large-liq-warning'
  | 'risk-large-liq-notify'
  | 'risk-adl-abnormal'

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
  'openapi-whitelist': 'OpenApi White Config',
  'openapi-market': 'OpenAPI Market Maker Config',
  'openapi-mm-blacklist': 'OpenApi MM Blacklist config',
  'financial-report': 'Financial Report',
  'transfer-record': 'Transfer Record',
  'financial-account': 'Financial Account Manage',
  'financial-recon': 'Financial Reconciliation Monitor',
  'finance-flow': 'financeFlow',
  'api-open-list': 'API Open List',
  'api-ratio-config': 'Ratio Config',
  'api-user-limit-config': 'User Limit Config',
  'api-user-taker-blacklist': 'User Taker Blacklist',
  'api-user-taker-config': 'User Taker Config',
  'tools-close-position': 'Close Position',
  'tools-global-frequency': 'GlobalFrequencyGroup',
  'tools-open-bottom-position': 'Open Bottom Position',
  'risk-funding-fee-change': '资金费率修改',
  'risk-liquidation-switch': '强平引擎开关',
  'risk-market-price-limit': '市价交易限制配置',
  'risk-reserve-list': '风险基金列表',
  'risk-reserve-detail': '风险基金明细',
  'risk-trading-restriction': '开平仓限制',
  'risk-spread-alert': '价差预警监控',
  'risk-no-trade-monitor': '无交易监控',
  'risk-depth-monitor': '档位深度监控',
  'risk-peer-spread-monitor': '友商价差监控',
  'risk-external-funding': '外部资金费率监控',
  'risk-internal-funding': '内部资金费率监控',
  'risk-large-liq-warning': '大额爆仓预警',
  'risk-large-liq-notify': '大额爆仓后通知',
  'risk-adl-abnormal': 'ADL异常记录',
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
      { key: 'openapi-whitelist', label: 'OpenApi White Config' },
      { key: 'openapi-market', label: 'OpenAPI Market Maker Config' },
      { key: 'openapi-mm-blacklist', label: 'OpenApi MM Blacklist config' },
    ],
  },
  {
    key: 'financial-mgmt',
    icon: <DollarOutlined />,
    label: 'Financial Management',
    children: [
      { key: 'financial-report', label: 'Financial Report' },
      { key: 'transfer-record', label: 'Transfer Record' },
      { key: 'financial-account', label: 'Financial Account Manage' },
      { key: 'financial-recon', label: 'Financial Reconciliation Monitor' },
      { key: 'finance-flow', label: 'FinanceFlow' },
    ],
  },
  {
    key: 'api-mgmt',
    icon: <ApiOutlined />,
    label: 'API Management',
    children: [
      { key: 'api-open-list', label: 'API Open List' },
      { key: 'api-ratio-config', label: 'Ratio Config' },
      { key: 'api-user-limit-config', label: 'User Limit Config' },
      { key: 'api-user-taker-blacklist', label: 'User Taker Blacklist' },
      { key: 'api-user-taker-config', label: 'User Taker Config' },
    ],
  },
  {
    key: 'tools-mgmt',
    icon: <ToolOutlined />,
    label: 'Tools Management',
    children: [
      { key: 'tools-close-position', label: 'Close Position' },
      { key: 'tools-global-frequency', label: 'GlobalFrequencyGroup' },
      { key: 'tools-open-bottom-position', label: 'Open Bottom Position' },
    ],
  },
  {
    key: 'risk-monitor',
    icon: <WarningOutlined />,
    label: '风控管理',
    children: [
      { key: 'risk-funding-fee-change', label: '资金费率修改' },
      { key: 'risk-liquidation-switch', label: '强平引擎开关' },
      { key: 'risk-market-price-limit', label: '市价交易限制配置' },
      { key: 'risk-reserve-list', label: '风险基金列表' },
      { key: 'risk-reserve-detail', label: '风险基金明细' },
      { key: 'risk-trading-restriction', label: '开平仓限制' },
    ],
  },
  {
    key: 'alarm-monitor',
    icon: <WarningOutlined />,
    label: '监控告警',
    children: [
      { key: 'risk-spread-alert', label: '价差预警监控' },
      { key: 'risk-no-trade-monitor', label: '无交易监控' },
      { key: 'risk-depth-monitor', label: '档位深度监控' },
      { key: 'risk-peer-spread-monitor', label: '友商价差监控' },
      { key: 'risk-external-funding', label: '外部资金费率监控' },
      { key: 'risk-internal-funding', label: '内部资金费率监控' },
      { key: 'risk-large-liq-warning', label: '大额爆仓预警' },
      { key: 'risk-large-liq-notify', label: '大额爆仓后通知' },
      { key: 'risk-adl-abnormal', label: 'ADL异常记录' },
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
  'alarm-monitor',
]
