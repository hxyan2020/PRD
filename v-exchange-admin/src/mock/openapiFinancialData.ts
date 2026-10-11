export const marketMakerWhitelist = [
  {
    contractFid: '100000001',
    remark: 'DB做市账户-MARKET_MAKER',
    creator: 'evan.bi@hytechc.com',
    createdAt: '2026-09-22 16:06:48',
  },
  {
    contractFid: '100000002',
    remark: 'DB撮合账户-MARKET_MAKER',
    creator: 'evan.bi@hytechc.com',
    createdAt: '2026-09-22 16:06:48',
  },
  {
    contractFid: '100000003',
    remark: 'K线策略账户-MARKET_MAKER',
    creator: 'evan.bi@hytechc.com',
    createdAt: '2026-09-22 16:06:48',
  },
]

export const financialAccountInfo = {
  accountId: '600001',
  currentInjectionUsd: 200_000,
}

export const financialFundRecords = [
  {
    accountId: '600001',
    flowType: 'Inflow',
    triggerType: 'Manual',
    amountUsd: '+800,000',
    updatedAt: '2024-09-25 10:12:00',
  },
  {
    accountId: '600001',
    flowType: 'Outflow',
    triggerType: 'Auto',
    amountUsd: '-1,000,000',
    updatedAt: '2024-09-24 18:30:00',
  },
  {
    accountId: '600001',
    flowType: 'Inflow',
    triggerType: 'Manual',
    amountUsd: '+5,000,000',
    updatedAt: '2024-09-23 09:00:00',
  },
  {
    accountId: '600001',
    flowType: 'Outflow',
    triggerType: 'Auto',
    amountUsd: '-5,000,000',
    updatedAt: '2024-09-22 16:45:00',
  },
]

export const globalFrequencyGroups = [
  {
    groupName: 'MM',
    ratio: '80.00%(24000.00/s)',
    operator: 'evan.bi@hytechc.com',
    createdAt: '2024-09-22 15:10:09',
    updatedAt: '2024-09-22 15:10:09',
  },
]
