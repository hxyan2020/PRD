import type { MenuProps } from 'antd';

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
  | 'openapi-market';

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
];

export function isPageKey(key: string): key is PageKey {
  return key in pageTitles;
}
