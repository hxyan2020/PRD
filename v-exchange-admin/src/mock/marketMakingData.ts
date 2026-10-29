export const dbTakeoverAccount = {
  accountId: '100000002',
  walletBalance: '200560.26 USD',
  maxTransferable: '200560.26 USD',
  injectedAmount: '200000 USD',
  autoInjectWaterline: '40000 USD',
  injectTargetWaterline: '200000 USD',
  totalMargin: '0 USD',
  totalPosition: '0 USD',
  totalUnrealizedPnl: '0 USD',
  accountEquity: '200560.26 USD',
  accountMmr: '1000000%',
}

export const dbFundFlowTypes = [
  { value: '全部', label: '全部' },
  { value: '自动减仓', label: '自动减仓' },
  { value: '资金费用', label: '资金费用' },
  { value: '回笼资金', label: '回笼资金' },
  { value: '自动注资', label: '自动注资' },
]

export const dbFundFlowRecords = [
  { accountId: '100000002', flowId: '21654551', type: '自动减仓', amount: 8.671111, time: '2026-10-26 23:58:12' },
  { accountId: '100000002', flowId: '21654532', type: '资金费用', amount: 0.03844, time: '2026-10-26 23:50:01' },
  { accountId: '100000002', flowId: '21654510', type: '资金费用', amount: -0.0002006156, time: '2026-10-26 23:40:08' },
  { accountId: '100000002', flowId: '21654488', type: '自动减仓', amount: 2.10455, time: '2026-10-26 22:15:33' },
  { accountId: '100000002', flowId: '21654461', type: '资金费用', amount: -0.012884, time: '2026-10-26 20:00:00' },
  { accountId: '100000002', flowId: '21654420', type: '自动减仓', amount: 15.2201, time: '2026-10-26 18:42:19' },
  { accountId: '100000002', flowId: '21654390', type: '资金费用', amount: 0.00088, time: '2026-10-26 16:00:00' },
  { accountId: '100000002', flowId: '21654355', type: '自动减仓', amount: -3.4412, time: '2026-10-26 14:22:47' },
]
