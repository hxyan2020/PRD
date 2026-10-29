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

export const dbAlarmTypeOptions = [
  { value: '全部', label: '全部' },
  { value: 'DB资金一级预警', label: 'DB资金一级预警' },
  { value: 'DB资金二级预警', label: 'DB资金二级预警' },
  { value: 'DB账户权益预警', label: 'DB账户权益预警' },
  { value: 'DB大额持仓预警', label: 'DB大额持仓预警' },
  { value: 'DB长时间持仓预警', label: 'DB长时间持仓预警' },
  { value: '注资金额上限预警', label: '注资金额上限预警' },
  { value: 'DB心跳预警', label: 'DB心跳预警' },
  { value: '回拨通知', label: '回拨通知' },
  { value: '注资通知', label: '注资通知' },
]

export const dbAlarmAddTypeOptions = dbAlarmTypeOptions.filter((o) => o.value !== '全部')

export const dbAlarmRecords = [
  { id: 1, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:46:32', channel: 'Lark' },
  { id: 2, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:46:02', channel: 'Lark' },
  { id: 3, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:45:32', channel: 'Lark' },
  { id: 4, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:45:02', channel: 'Lark' },
  { id: 5, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:44:32', channel: 'Lark' },
  { id: 6, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:44:02', channel: 'Lark' },
  { id: 7, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:43:45', channel: 'Lark' },
  { id: 8, type: 'DB心跳预警', info: '触发心跳撤单', time: '2024-10-29 00:43:15', channel: 'Lark' },
]

export const dbAlarmConfigs = [
  { id: 1, type: '注资通知', value: '事件触发', updatedAt: '2026-09-22 15:25:39', updatedBy: 'alex.huang@hytechc.com', status: '生效中' },
  { id: 2, type: '回拨通知', value: '事件触发', updatedAt: '2026-09-22 15:25:31', updatedBy: 'alex.huang@hytechc.com', status: '生效中' },
  { id: 3, type: 'DB心跳预警', value: '事件触发', updatedAt: '2026-09-22 15:25:26', updatedBy: 'alex.huang@hytechc.com', status: '生效中' },
  { id: 4, type: '注资金额上限预警', value: '事件触发', updatedAt: '2026-09-24 19:11:59', updatedBy: 'gary.liang@hytechc.com', status: '生效中' },
  { id: 5, type: 'DB长时间持仓预警', value: '持仓时间 > 10 mins', updatedAt: '2026-09-22 15:25:10', updatedBy: 'alex.huang@hytechc.com', status: '生效中' },
  { id: 6, type: 'DB长时间持仓预警', value: '持仓时间 > 5 mins', updatedAt: '2026-09-22 15:25:04', updatedBy: 'alex.huang@hytechc.com', status: '生效中' },
  { id: 7, type: 'DB大额持仓预警', value: '当前持仓仓位价值 > 500,000 USD', updatedAt: '2026-09-22 15:24:55', updatedBy: 'alex.huang@hytechc.com', status: '生效中' },
  { id: 8, type: 'DB大额持仓预警', value: '当前持仓仓位价值 > 300,000 USD', updatedAt: '2026-09-22 15:24:42', updatedBy: 'alex.huang@hytechc.com', status: '生效中' },
]
