import { getPageTitles, type PageKey } from '../config/menu';
import { useLocale } from './locale';

/** Common chrome / action copy shared across admin pages. */
export function useUi() {
  const { t, lang } = useLocale();
  const pageTitles = getPageTitles(lang);

  return {
    lang,
    t,
    pageTitle: (key: PageKey) => pageTitles[key],
    search: t('查询', 'Search'),
    reset: t('重置', 'Reset'),
    add: t('添加', 'Add'),
    edit: t('编辑', 'Edit'),
    delete: t('删除', 'Delete'),
    enable: t('启用', 'Enable'),
    disable: t('停用', 'Disable'),
    submit: t('提交', 'Submit'),
    confirm: t('确定', 'OK'),
    cancel: t('取消', 'Cancel'),
    action: t('操作', 'Action'),
    empty: t('暂无数据', 'No data'),
    pleaseInput: t('请输入', 'Please enter'),
    pleaseSelect: t('请选择', 'Please select'),
    status: t('状态', 'Status'),
    remark: t('备注', 'Remark'),
    creator: t('创建者', 'Created by'),
    createdAt: t('创建时间', 'Created at'),
    updatedAt: t('更新时间', 'Updated at'),
    operator: t('操作人', 'Operator'),
    contractName: t('合约名称', 'Contract'),
    alertRecords: t('告警记录', 'Alert records'),
    monitorConfig: t('监控配置', 'Monitor config'),
    total: (n: number) => t(`共 ${n} 条`, `Total ${n}`),
  };
}
