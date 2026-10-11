import type { ReactElement } from 'react'
import type { PageKey } from '../config/menu'
import { RedisKeyManagePage, RedisValueManagePage } from './config/RedisPages'
import { AdminAdlPage } from './AdminAdlPage'
import { CoinIntroducePage } from './CoinIntroducePage'
import { ContractListPage } from './ContractListPage'
import { FairPricePage } from './FairPricePage'
import { FundingRatePage } from './FundingRatePage'
import { IndexMarketLinkPage } from './IndexMarketLinkPage'
import { IndexPricePage } from './IndexPricePage'
import { KlineManagePage } from './KlineManagePage'
import { MarketSourcePage } from './MarketSourcePage'
import { OverviewPage } from './OverviewPage'
import { PlaceholderPage } from './PlaceholderPage'
import { PositionListPage } from './PositionListPage'
import { TradeAmountFactorPage } from './TradeAmountFactorPage'
import {
  ActiveOrderHistoryDealPage,
  ActiveOrderPage,
  AdlHistoryPage,
  LiquidateHistoryPage,
  PositionValueStatsPage,
  StopOrderHistoryDealPage,
  StopOrderPage,
  TriggerOrderHistoryDealPage,
  TriggerOrderPage,
} from './order/OrderPages'
import {
  BlacklistGroupPage,
  MarginChangePage,
  UserAssetPage,
  UserBlacklistPage,
  UserInfoPage,
  UserRateConfigPage,
  UserRiskSettingsPage,
} from './user/UserPages'

const underDev = () => <PlaceholderPage />

export const pageComponents: Record<PageKey, () => ReactElement> = {
  overview: OverviewPage,
  'contract-list': ContractListPage,
  'coin-introduce': CoinIntroducePage,
  'funding-fee-list': () => <PlaceholderPage message="Funding Fee List" />,
  'kline-manage': KlineManagePage,
  'trade-amount-factor': TradeAmountFactorPage,
  'admin-adl': AdminAdlPage,
  'market-source': MarketSourcePage,
  'index-price': IndexPricePage,
  'fair-price': FairPricePage,
  'index-market-link': IndexMarketLinkPage,
  'funding-rate': FundingRatePage,
  'position-list': PositionListPage,
  'position-value-stats': PositionValueStatsPage,
  'active-order': ActiveOrderPage,
  'trigger-order': TriggerOrderPage,
  'stop-order': StopOrderPage,
  'active-order-history-deal': ActiveOrderHistoryDealPage,
  'trigger-order-history-deal': TriggerOrderHistoryDealPage,
  'liquidate-history': LiquidateHistoryPage,
  'adl-history': AdlHistoryPage,
  'stop-order-history-deal': StopOrderHistoryDealPage,
  'user-asset': UserAssetPage,
  'user-rate-config': UserRateConfigPage,
  'user-info': UserInfoPage,
  'user-risk-settings': UserRiskSettingsPage,
  'user-blacklist': UserBlacklistPage,
  'blacklist-group': BlacklistGroupPage,
  'margin-change': MarginChangePage,
  'redis-key-manage': RedisKeyManagePage,
  'redis-value-manage': RedisValueManagePage,
  'openapi-whitelist': underDev,
  'openapi-market': underDev,
  'openapi-mm-blacklist': underDev,
  'financial-report': underDev,
  'transfer-record': underDev,
  'financial-account': underDev,
  'financial-recon': underDev,
  'finance-flow': underDev,
  'api-manage': underDev,
  'tools-close-position': underDev,
  'tools-global-frequency': underDev,
  'tools-open-bottom-position': underDev,
  'risk-funding-fee-change': underDev,
  'risk-liquidation-switch': underDev,
  'risk-market-price-limit': underDev,
  'risk-reserve-list': underDev,
  'risk-reserve-detail': underDev,
  'risk-trading-restriction': underDev,
}
