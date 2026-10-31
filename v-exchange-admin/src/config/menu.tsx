import type { MenuProps } from 'antd';
import {
  AlertOutlined,
  ApiOutlined,
  DollarOutlined,
  FundOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ToolOutlined,
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
  // 财务管理
  | 'financial-report'
  | 'transfer-record'
  | 'financial-account'
  | 'financial-recon'
  | 'finance-flow'
  // API 管理
  | 'api-open-list'
  | 'api-ratio-config'
  | 'api-user-limit-config'
  | 'api-user-taker-blacklist'
  | 'api-user-taker-config'
  // 工具管理
  | 'tools-close-position'
  | 'tools-global-frequency'
  | 'tools-open-bottom-position'
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

export const sideMenuItems: MenuProps['items'] = [
  { key: 'overview', label: '总览' },
  {
    key: 'contract-manage',
    label: '合约管理',
    children: [
      { key: 'contract-list', label: '合约列表' },
      { key: 'coin-introduce', label: '币种介绍' },
      { key: 'funding-fee-list', label: '资金费用列表' },
      { key: 'kline-manage', label: 'K线管理' },
      { key: 'trade-amount-factor', label: '交易额系数配置' },
      { key: 'admin-adl', label: '一键平仓' },
    ],
  },
  {
    key: 'price-manage',
    label: '价格管理',
    children: [
      { key: 'market-source', label: '行情源' },
      { key: 'index-price', label: '指数价格' },
      { key: 'fair-price', label: '合理价格' },
      { key: 'index-market-link', label: '指数行情映射' },
      { key: 'funding-rate', label: '资金费率' },
    ],
  },
  {
    key: 'order-manage',
    label: '订单管理',
    children: [
      { key: 'position-list', label: '持仓列表' },
      { key: 'position-value-search', label: '仓位价值查询' },
      {
        key: 'order-list-group',
        label: '订单列表',
        children: [
          { key: 'active-order', label: '当前委托' },
          { key: 'trigger-order', label: '计划委托' },
          { key: 'stop-order', label: '止盈止损' },
        ],
      },
      {
        key: 'deal-list-group',
        label: '成交列表',
        children: [
          { key: 'active-order-history-deal', label: '委托成交历史' },
          { key: 'trigger-order-history-deal', label: '计划委托成交历史' },
          { key: 'liquidate-history', label: '强平历史' },
          { key: 'adl-history', label: 'ADL历史' },
          { key: 'stop-order-history-deal', label: '止盈止损成交历史' },
        ],
      },
    ],
  },
  {
    key: 'user-manage',
    label: '用户管理',
    children: [
      { key: 'user-asset', label: '用户资产' },
      { key: 'user-rate-config', label: '用户费率配置' },
      { key: 'user-info', label: '用户信息' },
      { key: 'user-risk-settings', label: '用户风控设置' },
      { key: 'user-blacklist', label: '用户黑名单' },
      { key: 'blacklist-group', label: '黑名单分组' },
      { key: 'margin-change', label: '保证金变更' },
    ],
  },
  {
    key: 'contract-config',
    label: '合约配置',
    children: [
      { key: 'redis-key-manage', label: 'Redis Key 管理' },
      { key: 'redis-value-manage', label: 'Redis Value 管理' },
      { key: 'openapi-white-list', label: 'OpenAPI 白名单' },
      { key: 'openapi-market', label: 'OpenAPI 行情' },
      { key: 'openapi-mm-blacklist', label: 'OpenAPI 做市黑名单' },
    ],
  },
  {
    key: 'financial-manage',
    icon: <DollarOutlined style={{ color: '#389e0d' }} />,
    label: '财务管理',
    children: [
      { key: 'financial-report', label: '财务报表' },
      { key: 'transfer-record', label: '划转记录' },
      { key: 'financial-account', label: '财务账户管理' },
      { key: 'financial-recon', label: '财务对账监控' },
      { key: 'finance-flow', label: '资金流水' },
    ],
  },
  {
    key: 'api-manage',
    icon: <ApiOutlined style={{ color: '#13c2c2' }} />,
    label: 'API管理',
    children: [
      { key: 'api-open-list', label: 'API开放白名单' },
      { key: 'api-ratio-config', label: '限额系数配置' },
      { key: 'api-user-limit-config', label: '用户限额配置' },
      { key: 'api-user-taker-blacklist', label: '用户 Taker 黑名单' },
      { key: 'api-user-taker-config', label: '用户 Taker 配置' },
    ],
  },
  {
    key: 'tools-manage',
    icon: <ToolOutlined />,
    label: '工具管理',
    children: [
      { key: 'tools-close-position', label: '平仓工具' },
      { key: 'tools-global-frequency', label: '全局频率分组' },
      { key: 'tools-open-bottom-position', label: '开底仓' },
    ],
  },
  {
    key: 'risk-manage',
    icon: <SafetyCertificateOutlined style={{ color: '#722ed1' }} />,
    label: '风控管理',
    children: [
      { key: 'funding-rate-modify', label: '资金费率修改' },
      { key: 'liquidation-engine-switch', label: '强平引擎开关' },
      { key: 'market-trade-limit', label: '市价交易限制配置' },
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
      { key: 'large-position-notify', label: '大额爆仓后通知' },
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
    label: 'Broker 管理',
    children: [{ key: 'broker-overview', label: 'Broker 概览' }],
  },
];

export function isPageKey(key: string): key is PageKey {
  return key in pageTitles;
}
