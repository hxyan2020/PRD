import type { PageKey } from '../config/menu';
import { AdlAbnormalRecordPage } from '../pages/AdlAbnormalRecordPage';
import { AdminAdlPage } from '../pages/AdminAdlPage';
import { CoinIntroducePage } from '../pages/CoinIntroducePage';
import { CompetitorSpreadMonitorPage } from '../pages/CompetitorSpreadMonitorPage';
import { ContractListPage } from '../pages/ContractListPage';
import { DbAccountAlertPage } from '../pages/DbAccountAlertPage';
import { DbTakeoverAccountPage } from '../pages/DbTakeoverAccountPage';
import { DepthMonitorPage } from '../pages/DepthMonitorPage';
import { ExternalFundingRateMonitorPage } from '../pages/ExternalFundingRateMonitorPage';
import { FairPricePage } from '../pages/FairPricePage';
import { FundingRateModifyPage } from '../pages/FundingRateModifyPage';
import { FundingRatePage } from '../pages/FundingRatePage';
import { IndexMarketLinkPage } from '../pages/IndexMarketLinkPage';
import { IndexPricePage } from '../pages/IndexPricePage';
import { InternalFundingRateMonitorPage } from '../pages/InternalFundingRateMonitorPage';
import { KLineManagePage } from '../pages/KLineManagePage';
import { LargeLiquidationAlertPage } from '../pages/LargeLiquidationAlertPage';
import { LargeLiquidationNotifyPage } from '../pages/LargeLiquidationNotifyPage';
import { MarketSourcePage } from '../pages/MarketSourcePage';
import { MarketTradeLimitPage } from '../pages/MarketTradeLimitPage';
import { NoTradeMonitorPage } from '../pages/NoTradeMonitorPage';
import { OpenCloseLimitPage } from '../pages/OpenCloseLimitPage';
import { OverviewPage } from '../pages/OverviewPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { PositionListPage } from '../pages/PositionListPage';
import { RiskFundDetailPage } from '../pages/RiskFundDetailPage';
import { RiskFundListPage } from '../pages/RiskFundListPage';
import { SpreadAlertMonitorPage } from '../pages/SpreadAlertMonitorPage';
import { TradeAmountFactorPage } from '../pages/TradeAmountFactorPage';

export function renderPage(key: PageKey) {
  switch (key) {
    case 'overview':
      return <OverviewPage />;
    case 'contract-list':
      return <ContractListPage />;
    case 'coin-introduce':
      return <CoinIntroducePage />;
    case 'kline-manage':
      return <KLineManagePage />;
    case 'trade-amount-factor':
      return <TradeAmountFactorPage />;
    case 'admin-adl':
      return <AdminAdlPage />;
    case 'market-source':
      return <MarketSourcePage />;
    case 'index-price':
      return <IndexPricePage />;
    case 'fair-price':
      return <FairPricePage />;
    case 'index-market-link':
      return <IndexMarketLinkPage />;
    case 'funding-rate':
      return <FundingRatePage />;
    case 'position-list':
      return <PositionListPage />;
    case 'funding-rate-modify':
      return <FundingRateModifyPage />;
    case 'market-trade-limit':
      return <MarketTradeLimitPage />;
    case 'risk-fund-list':
      return <RiskFundListPage />;
    case 'risk-fund-detail':
      return <RiskFundDetailPage />;
    case 'open-close-limit':
      return <OpenCloseLimitPage />;
    case 'spread-alert-monitor':
      return <SpreadAlertMonitorPage />;
    case 'no-trade-monitor':
      return <NoTradeMonitorPage />;
    case 'depth-monitor':
      return <DepthMonitorPage />;
    case 'competitor-spread-monitor':
      return <CompetitorSpreadMonitorPage />;
    case 'external-funding-rate-monitor':
      return <ExternalFundingRateMonitorPage />;
    case 'internal-funding-rate-monitor':
      return <InternalFundingRateMonitorPage />;
    case 'large-liquidation-alert':
      return <LargeLiquidationAlertPage />;
    case 'large-position-notify':
      return <LargeLiquidationNotifyPage />;
    case 'adl-abnormal-record':
      return <AdlAbnormalRecordPage />;
    case 'db-takeover-account':
      return <DbTakeoverAccountPage />;
    case 'db-account-alert':
      return <DbAccountAlertPage />;
    default:
      return <PlaceholderPage />;
  }
}
