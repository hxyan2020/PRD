export const financialAccountInfo = {
  accountId: '600001',
  currentInjectionUsd: 200_000,
};

export const financialFundRecords = [
  {
    key: '1',
    accountId: '600001',
    flowType: '入金',
    triggerType: '手动',
    amountUsd: '+800,000',
    updatedAt: '2024-09-25 10:12:00',
  },
  {
    key: '2',
    accountId: '600001',
    flowType: '出金',
    triggerType: '自动',
    amountUsd: '-1,000,000',
    updatedAt: '2024-09-24 18:30:00',
  },
  {
    key: '3',
    accountId: '600001',
    flowType: '入金',
    triggerType: '手动',
    amountUsd: '+5,000,000',
    updatedAt: '2024-09-23 09:00:00',
  },
  {
    key: '4',
    accountId: '600001',
    flowType: '出金',
    triggerType: '自动',
    amountUsd: '-5,000,000',
    updatedAt: '2024-09-22 16:45:00',
  },
];

export const globalFrequencyGroups = [
  {
    key: '1',
    groupName: 'MM',
    ratio: '80.00%(24000.00/s)',
    operator: 'evan.bi@hytechc.com',
    createdAt: '2024-09-22 15:10:09',
    updatedAt: '2024-09-22 15:10:09',
  },
];
