import type { MenuProps } from 'antd';
import {
  AlertOutlined,
  FundOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';

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
  | 'position-value-search'
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
  | 'openapi-white-list'
  | 'openapi-market'
  // 风控管理
  | 'funding-rate-modify'
  | 'liquidation-engine-switch'
  | 'market-trade-limit'
  | 'risk-fund-list'
  | 'risk-fund-detail'
  | 'open-close-limit'
  // 监控告警
  | 'spread-alert-monitor'
  | 'no-trade-monitor'
  | 'depth-monitor'
  | 'competitor-spread-monitor'
  | 'external-funding-rate-monitor'
  | 'internal-funding-rate-monitor'
  | 'large-liquidation-alert'
  | 'large-position-notify'
  | 'adl-abnormal-record'
  // 做市 / Broker
  | 'db-takeover-account'
  | 'db-takeover-asset'
  | 'db-account-alert'
  | 'broker-overview';

export const pageTitles: Record<PageKey, string> = {
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
  'position-value-search': 'Position Value Search',
  'order-list': 'Order List',
  'deal-list': 'Deal List',
  'user-asset': 'User Asset',
  'user-rate-config': 'User Rate Config',
  'user-info': 'User Info',
  'user-risk-settings': 'User Risk Settings',
  'user-blacklist': 'User Blacklist',
  'blacklist-group': 'Blacklist Group',
  'margin-change': 'Margin Change',
  'redis-key-manage': 'Redis Key Manage',
  'redis-value-manage': 'Redis Value Manage',
  'openapi-white-list': 'OpenApi White List',
  'openapi-market': 'OpenApi Market',
  'funding-rate-modify': '资金费率修改',
  'liquidation-engine-switch': '强平引擎开关',
  'market-trade-limit': '市价交易限制',
  'risk-fund-list': '风险基金列表',
  'risk-fund-detail': '风险基金明细',
  'open-close-limit': '开平仓限制',
  'spread-alert-monitor': '价差预警监控',
  'no-trade-monitor': '无交易监控',
  'depth-monitor': '档位深度监控',
  'competitor-spread-monitor': '友商价差监控',
  'external-funding-rate-monitor': '外部资金费率监控',
  'internal-funding-rate-monitor': '内部资金费率监控',
  'large-liquidation-alert': '大额爆仓预警',
  'large-position-notify': '大额持仓通知',
  'adl-abnormal-record': 'ADL异常记录',
  'db-takeover-account': 'DB接仓账户管理',
  'db-takeover-asset': 'DB接仓账户资金',
  'db-account-alert': 'DB账户告警',
  'broker-overview': 'Broker管理',
};

export const sideMenuItems: MenuProps['items'] = [
  { key: 'overview', label: 'Overview' },
  {
    key: 'contract-manage',
    label: 'Contract Manage',
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
    key: 'price-manage',
    label: 'Price Manage',
    children: [
      { key: 'market-source', label: 'Market Source' },
      { key: 'index-price', label: 'Index Price' },
      { key: 'fair-price', label: 'Fair Price' },
      { key: 'index-market-link', label: 'Index Market Link' },
      { key: 'funding-rate', label: 'Funding Rate' },
    ],
  },
  {
    key: 'order-manage',
    label: 'Order Manage',
    children: [
      { key: 'position-list', label: 'Position List' },
      { key: 'position-value-search', label: 'Position Value Search' },
      { key: 'order-list', label: 'Order List' },
      { key: 'deal-list', label: 'Deal List' },
    ],
  },
  {
    key: 'user-manage',
    label: 'User Manage',
    children: [
      { key: 'user-asset', label: 'User Asset' },
      { key: 'user-rate-config', label: 'User Rate Config' },
      { key: 'user-info', label: 'User Info' },
      { key: 'user-risk-settings', label: 'User Risk Settings' },
      { key: 'user-blacklist', label: 'User Blacklist' },
      { key: 'blacklist-group', label: 'Blacklist Group' },
      { key: 'margin-change', label: 'Margin Change' },
    ],
  },
  {
    key: 'contract-config',
    label: 'Contract Config',
    children: [
      { key: 'redis-key-manage', label: 'Redis Key Manage' },
      { key: 'redis-value-manage', label: 'Redis Value Manage' },
      { key: 'openapi-white-list', label: 'OpenApi White List' },
      { key: 'openapi-market', label: 'OpenApi Market' },
    ],
  },
  // 两个分开的一级菜单：风控管理 / 监控告警
  {
    key: 'risk-manage',
    icon: <SafetyCertificateOutlined style={{ color: '#722ed1' }} />,
    label: '风控管理',
    children: [
      { key: 'funding-rate-modify', label: '资金费率修改' },
      { key: 'liquidation-engine-switch', label: '强平引擎开关' },
      { key: 'market-trade-limit', label: '市价交易限制' },
      { key: 'risk-fund-list', label: '风险基金列表' },
      { key: 'risk-fund-detail', label: '风险基金明细' },
      { key: 'open-close-limit', label: '开平仓限制' },
    ],
  },
  {
    key: 'monitor-alert',
    icon: <AlertOutlined style={{ color: '#fa8c16' }} />,
    label: '监控告警',
    children: [
      { key: 'spread-alert-monitor', label: '价差预警监控' },
      { key: 'no-trade-monitor', label: '无交易监控' },
      { key: 'depth-monitor', label: '档位深度监控' },
      { key: 'competitor-spread-monitor', label: '友商价差监控' },
      { key: 'external-funding-rate-monitor', label: '外部资金费率监控' },
      { key: 'internal-funding-rate-monitor', label: '内部资金费率监控' },
      { key: 'large-liquidation-alert', label: '大额爆仓预警' },
      { key: 'large-position-notify', label: '大额持仓通知' },
      { key: 'adl-abnormal-record', label: 'ADL异常记录' },
    ],
  },
  {
    key: 'mm-manage',
    icon: <FundOutlined />,
    label: '做市管理',
    children: [
      { key: 'db-takeover-account', label: 'DB接仓账户管理' },
      { key: 'db-takeover-asset', label: 'DB接仓账户资金' },
      { key: 'db-account-alert', label: 'DB账户告警' },
    ],
  },
  {
    key: 'broker-manage',
    icon: <TeamOutlined />,
    label: 'Broker管理',
    children: [{ key: 'broker-overview', label: 'Broker概览' }],
  },
];

export function isPageKey(key: string): key is PageKey {
  return key in pageTitles;
}
