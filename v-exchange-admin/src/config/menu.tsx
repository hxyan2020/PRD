import type { MenuProps } from 'antd';
import {
  AlertOutlined,
  ApiOutlined,
  AppstoreOutlined,
  DollarOutlined,
  FileTextOutlined,
  FundOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AppLang } from '../i18n/locale';

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
  | 'openapi-white-list'
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
  | 'funding-rate-modify'
  | 'liquidation-engine-switch'
  | 'market-trade-limit'
  | 'risk-fund-list'
  | 'risk-fund-detail'
  | 'open-close-limit'
  | 'spread-alert-monitor'
  | 'no-trade-monitor'
  | 'depth-monitor'
  | 'competitor-spread-monitor'
  | 'external-funding-rate-monitor'
  | 'internal-funding-rate-monitor'
  | 'large-liquidation-alert'
  | 'large-position-notify'
  | 'adl-abnormal-record'
  | 'db-takeover-account'
  | 'db-takeover-asset'
  | 'db-account-alert'
  | 'broker-overview';

const pageTitlesZh: Record<PageKey, string> = {
  overview: '总览',
  'contract-list': '合约列表',
  'coin-introduce': '币种介绍',
  'funding-fee-list': '资金费用列表',
  'kline-manage': 'K线管理',
  'trade-amount-factor': '交易额系数配置',
  'admin-adl': '一键平仓',
  'market-source': '行情源',
  'index-price': '指数价格',
  'fair-price': '合理价格',
  'index-market-link': '指数行情映射',
  'funding-rate': '资金费率',
  'position-list': '持仓列表',
  'position-value-search': '仓位价值查询',
  'active-order': '当前委托',
  'trigger-order': '计划委托',
  'stop-order': '止盈止损',
  'active-order-history-deal': '委托成交历史',
  'trigger-order-history-deal': '计划委托成交历史',
  'liquidate-history': '强平历史',
  'adl-history': 'ADL历史',
  'stop-order-history-deal': '止盈止损成交历史',
  'user-asset': '用户资产',
  'user-rate-config': '用户费率配置',
  'user-info': '用户信息',
  'user-risk-settings': '用户风控设置',
  'user-blacklist': '用户黑名单',
  'blacklist-group': '黑名单分组',
  'margin-change': '保证金变更',
  'redis-key-manage': 'Redis Key 管理',
  'redis-value-manage': 'Redis Value 管理',
  'openapi-white-list': 'OpenAPI 白名单',
  'openapi-market': 'OpenAPI 行情',
  'openapi-mm-blacklist': 'OpenAPI 做市黑名单',
  'financial-report': '财务报表',
  'transfer-record': '划转记录',
  'financial-account': '财务账户管理',
  'financial-recon': '财务对账监控',
  'finance-flow': '资金流水',
  'api-open-list': 'API开放白名单',
  'api-ratio-config': '限额系数配置',
  'api-user-limit-config': '用户限额配置',
  'api-user-taker-blacklist': '用户 Taker 黑名单',
  'api-user-taker-config': '用户 Taker 配置',
  'tools-close-position': '平仓工具',
  'tools-global-frequency': '全局频率分组',
  'tools-open-bottom-position': '开底仓',
  'funding-rate-modify': '资金费率修改',
  'liquidation-engine-switch': '强平引擎开关',
  'market-trade-limit': '市价交易限制配置',
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
  'large-position-notify': '大额爆仓后通知',
  'adl-abnormal-record': 'ADL异常记录',
  'db-takeover-account': 'DB接仓账户管理',
  'db-takeover-asset': 'DB接仓账户资金',
  'db-account-alert': 'DB账户告警',
  'broker-overview': 'Broker 概览',
};

const pageTitlesEn: Record<PageKey, string> = {
  overview: 'Overview',
  'contract-list': 'Contract List',
  'coin-introduce': 'Coin Introduce',
  'funding-fee-list': 'Funding Fee List',
  'kline-manage': 'KLine Manage',
  'trade-amount-factor': 'Trade Amount Factor',
  'admin-adl': 'Close Position (Admin)',
  'market-source': 'Market Source',
  'index-price': 'Index Price',
  'fair-price': 'Fair Price',
  'index-market-link': 'Index Market Link',
  'funding-rate': 'Funding Rate',
  'position-list': 'Position List',
  'position-value-search': 'Position Value Search',
  'active-order': 'Active Order',
  'trigger-order': 'Trigger Order',
  'stop-order': 'Stop Order',
  'active-order-history-deal': 'Active Order History',
  'trigger-order-history-deal': 'Trigger Order History',
  'liquidate-history': 'Liquidation History',
  'adl-history': 'ADL History',
  'stop-order-history-deal': 'Stop Order History',
  'user-asset': 'User Asset',
  'user-rate-config': 'User Rate Config',
  'user-info': 'User Info',
  'user-risk-settings': 'User Risk Settings',
  'user-blacklist': 'User Blacklist',
  'blacklist-group': 'Blacklist Group',
  'margin-change': 'Margin Change',
  'redis-key-manage': 'Redis Key Manage',
  'redis-value-manage': 'Redis Value Manage',
  'openapi-white-list': 'OpenAPI Whitelist',
  'openapi-market': 'OpenAPI Market',
  'openapi-mm-blacklist': 'OpenAPI MM Blacklist',
  'financial-report': 'Financial Report',
  'transfer-record': 'Transfer Record',
  'financial-account': 'Financial Account',
  'financial-recon': 'Financial Reconciliation',
  'finance-flow': 'Finance Flow',
  'api-open-list': 'API Open List',
  'api-ratio-config': 'Ratio Config',
  'api-user-limit-config': 'User Limit Config',
  'api-user-taker-blacklist': 'User Taker Blacklist',
  'api-user-taker-config': 'User Taker Config',
  'tools-close-position': 'Close Position Tool',
  'tools-global-frequency': 'Global Frequency Group',
  'tools-open-bottom-position': 'Open Bottom Position',
  'funding-rate-modify': 'Funding Rate Modify',
  'liquidation-engine-switch': 'Liquidation Engine Switch',
  'market-trade-limit': 'Market Trade Limit',
  'risk-fund-list': 'Risk Fund List',
  'risk-fund-detail': 'Risk Fund Detail',
  'open-close-limit': 'Open/Close Limit',
  'spread-alert-monitor': 'Spread Alert Monitor',
  'no-trade-monitor': 'No-Trade Monitor',
  'depth-monitor': 'Depth Monitor',
  'competitor-spread-monitor': 'Competitor Spread Monitor',
  'external-funding-rate-monitor': 'External Funding Rate Monitor',
  'internal-funding-rate-monitor': 'Internal Funding Rate Monitor',
  'large-liquidation-alert': 'Large Liquidation Alert',
  'large-position-notify': 'Large Liquidation Notify',
  'adl-abnormal-record': 'ADL Abnormal Record',
  'db-takeover-account': 'DB Takeover Account',
  'db-takeover-asset': 'DB Takeover Asset',
  'db-account-alert': 'DB Account Alert',
  'broker-overview': 'Broker Overview',
};

/** @deprecated Prefer getPageTitles(lang); kept for callers that default to zh. */
export const pageTitles = pageTitlesZh;

export function getPageTitles(lang: AppLang): Record<PageKey, string> {
  return lang === 'zh' ? pageTitlesZh : pageTitlesEn;
}

type GroupKey =
  | 'contract-manage'
  | 'price-manage'
  | 'order-manage'
  | 'order-list-group'
  | 'deal-list-group'
  | 'user-manage'
  | 'contract-config'
  | 'financial-manage'
  | 'api-manage'
  | 'tools-manage'
  | 'risk-manage'
  | 'monitor-alert'
  | 'mm-manage'
  | 'broker-manage';

const groupLabelsZh: Record<GroupKey, string> = {
  'contract-manage': '合约管理',
  'price-manage': '价格管理',
  'order-manage': '订单管理',
  'order-list-group': '订单列表',
  'deal-list-group': '成交列表',
  'user-manage': '用户管理',
  'contract-config': '合约配置',
  'financial-manage': '财务管理',
  'api-manage': 'API管理',
  'tools-manage': '工具管理',
  'risk-manage': '风控管理',
  'monitor-alert': '监控告警',
  'mm-manage': '做市管理',
  'broker-manage': 'Broker 管理',
};

const groupLabelsEn: Record<GroupKey, string> = {
  'contract-manage': 'Contract Manage',
  'price-manage': 'Price Manage',
  'order-manage': 'Order Manage',
  'order-list-group': 'Order List',
  'deal-list-group': 'Deal List',
  'user-manage': 'User Manage',
  'contract-config': 'Contract Config',
  'financial-manage': 'Financial Management',
  'api-manage': 'API Management',
  'tools-manage': 'Tools Management',
  'risk-manage': 'Risk Management',
  'monitor-alert': 'Monitor & Alert',
  'mm-manage': 'Market Making',
  'broker-manage': 'Broker Manage',
};

export function getSideMenuItems(lang: AppLang): MenuProps['items'] {
  const p = getPageTitles(lang);
  const g = lang === 'zh' ? groupLabelsZh : groupLabelsEn;

  return [
    { key: 'overview', icon: <AppstoreOutlined />, label: p.overview },
    {
      key: 'contract-manage',
      icon: <FileTextOutlined />,
      label: g['contract-manage'],
      children: [
        { key: 'contract-list', label: p['contract-list'] },
        { key: 'coin-introduce', label: p['coin-introduce'] },
        { key: 'funding-fee-list', label: p['funding-fee-list'] },
        { key: 'kline-manage', label: p['kline-manage'] },
        { key: 'trade-amount-factor', label: p['trade-amount-factor'] },
        { key: 'admin-adl', label: p['admin-adl'] },
      ],
    },
    {
      key: 'price-manage',
      icon: <LineChartOutlined />,
      label: g['price-manage'],
      children: [
        { key: 'market-source', label: p['market-source'] },
        { key: 'index-price', label: p['index-price'] },
        { key: 'fair-price', label: p['fair-price'] },
        { key: 'index-market-link', label: p['index-market-link'] },
        { key: 'funding-rate', label: p['funding-rate'] },
      ],
    },
    {
      key: 'order-manage',
      icon: <ShoppingOutlined />,
      label: g['order-manage'],
      children: [
        { key: 'position-list', label: p['position-list'] },
        { key: 'position-value-search', label: p['position-value-search'] },
        {
          key: 'order-list-group',
          label: g['order-list-group'],
          children: [
            { key: 'active-order', label: p['active-order'] },
            { key: 'trigger-order', label: p['trigger-order'] },
            { key: 'stop-order', label: p['stop-order'] },
          ],
        },
        {
          key: 'deal-list-group',
          label: g['deal-list-group'],
          children: [
            { key: 'active-order-history-deal', label: p['active-order-history-deal'] },
            { key: 'trigger-order-history-deal', label: p['trigger-order-history-deal'] },
            { key: 'liquidate-history', label: p['liquidate-history'] },
            { key: 'adl-history', label: p['adl-history'] },
            { key: 'stop-order-history-deal', label: p['stop-order-history-deal'] },
          ],
        },
      ],
    },
    {
      key: 'user-manage',
      icon: <UserOutlined />,
      label: g['user-manage'],
      children: [
        { key: 'user-asset', label: p['user-asset'] },
        { key: 'user-rate-config', label: p['user-rate-config'] },
        { key: 'user-info', label: p['user-info'] },
        { key: 'user-risk-settings', label: p['user-risk-settings'] },
        { key: 'user-blacklist', label: p['user-blacklist'] },
        { key: 'blacklist-group', label: p['blacklist-group'] },
        { key: 'margin-change', label: p['margin-change'] },
      ],
    },
    {
      key: 'contract-config',
      icon: <SettingOutlined />,
      label: g['contract-config'],
      children: [
        { key: 'redis-key-manage', label: p['redis-key-manage'] },
        { key: 'redis-value-manage', label: p['redis-value-manage'] },
        { key: 'openapi-white-list', label: p['openapi-white-list'] },
        { key: 'openapi-market', label: p['openapi-market'] },
        { key: 'openapi-mm-blacklist', label: p['openapi-mm-blacklist'] },
      ],
    },
    {
      key: 'financial-manage',
      icon: <DollarOutlined />,
      label: g['financial-manage'],
      children: [
        { key: 'financial-report', label: p['financial-report'] },
        { key: 'transfer-record', label: p['transfer-record'] },
        { key: 'financial-account', label: p['financial-account'] },
        { key: 'financial-recon', label: p['financial-recon'] },
        { key: 'finance-flow', label: p['finance-flow'] },
      ],
    },
    {
      key: 'api-manage',
      icon: <ApiOutlined />,
      label: g['api-manage'],
      children: [
        { key: 'api-open-list', label: p['api-open-list'] },
        { key: 'api-ratio-config', label: p['api-ratio-config'] },
        { key: 'api-user-limit-config', label: p['api-user-limit-config'] },
        { key: 'api-user-taker-blacklist', label: p['api-user-taker-blacklist'] },
        { key: 'api-user-taker-config', label: p['api-user-taker-config'] },
      ],
    },
    {
      key: 'tools-manage',
      icon: <ToolOutlined />,
      label: g['tools-manage'],
      children: [
        { key: 'tools-close-position', label: p['tools-close-position'] },
        { key: 'tools-global-frequency', label: p['tools-global-frequency'] },
        { key: 'tools-open-bottom-position', label: p['tools-open-bottom-position'] },
      ],
    },
    {
      key: 'risk-manage',
      icon: <SafetyCertificateOutlined />,
      label: g['risk-manage'],
      children: [
        { key: 'funding-rate-modify', label: p['funding-rate-modify'] },
        { key: 'liquidation-engine-switch', label: p['liquidation-engine-switch'] },
        { key: 'market-trade-limit', label: p['market-trade-limit'] },
        { key: 'risk-fund-list', label: p['risk-fund-list'] },
        { key: 'risk-fund-detail', label: p['risk-fund-detail'] },
        { key: 'open-close-limit', label: p['open-close-limit'] },
      ],
    },
    {
      key: 'monitor-alert',
      icon: <AlertOutlined />,
      label: g['monitor-alert'],
      children: [
        { key: 'spread-alert-monitor', label: p['spread-alert-monitor'] },
        { key: 'no-trade-monitor', label: p['no-trade-monitor'] },
        { key: 'depth-monitor', label: p['depth-monitor'] },
        { key: 'competitor-spread-monitor', label: p['competitor-spread-monitor'] },
        { key: 'external-funding-rate-monitor', label: p['external-funding-rate-monitor'] },
        { key: 'internal-funding-rate-monitor', label: p['internal-funding-rate-monitor'] },
        { key: 'large-liquidation-alert', label: p['large-liquidation-alert'] },
        { key: 'large-position-notify', label: p['large-position-notify'] },
        { key: 'adl-abnormal-record', label: p['adl-abnormal-record'] },
      ],
    },
    {
      key: 'mm-manage',
      icon: <FundOutlined />,
      label: g['mm-manage'],
      children: [
        { key: 'db-takeover-account', label: p['db-takeover-account'] },
        { key: 'db-takeover-asset', label: p['db-takeover-asset'] },
        { key: 'db-account-alert', label: p['db-account-alert'] },
      ],
    },
    {
      key: 'broker-manage',
      icon: <TeamOutlined />,
      label: g['broker-manage'],
      children: [{ key: 'broker-overview', label: p['broker-overview'] }],
    },
  ];
}

/** @deprecated Prefer getSideMenuItems(lang) */
export const sideMenuItems = getSideMenuItems('zh');

export function isPageKey(key: string): key is PageKey {
  return key in pageTitlesZh;
}
