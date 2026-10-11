import type { ReactElement } from 'react'
import type { PageKey } from '../config/menu'
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

export const pageComponents: Record<PageKey, () => ReactElement> = {
  overview: OverviewPage,
  'contract-list': ContractListPage,
  'coin-introduce': CoinIntroducePage,
  'funding-fee-list': () => <PlaceholderPage message="Funding Fee List — add details when screenshots provided" />,
  'kline-manage': KlineManagePage,
  'trade-amount-factor': TradeAmountFactorPage,
  'admin-adl': AdminAdlPage,
  'market-source': MarketSourcePage,
  'index-price': IndexPricePage,
  'fair-price': FairPricePage,
  'index-market-link': IndexMarketLinkPage,
  'funding-rate': FundingRatePage,
  'position-list': PositionListPage,
  'position-value-stats': () => <PlaceholderPage />,
  'order-list': () => <PlaceholderPage />,
  'deal-list': () => <PlaceholderPage />,
  'user-asset': () => <PlaceholderPage />,
  'user-rate-config': () => <PlaceholderPage />,
  'user-info': () => <PlaceholderPage />,
  'user-risk-settings': () => <PlaceholderPage />,
  'user-blacklist': () => <PlaceholderPage />,
  'blacklist-group': () => <PlaceholderPage />,
  'margin-change': () => <PlaceholderPage />,
  'redis-key-manage': () => <PlaceholderPage />,
  'redis-value-manage': () => <PlaceholderPage />,
  'openapi-whitelist': () => <PlaceholderPage />,
  'openapi-market': () => <PlaceholderPage />,
  'financial-report': () => <PlaceholderPage />,
  'transfer-record': () => <PlaceholderPage />,
  'financial-account': () => <PlaceholderPage />,
  'financial-recon': () => <PlaceholderPage />,
  'finance-flow': () => <PlaceholderPage />,
}
