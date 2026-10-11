import { Button, Space } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'

type QueryResetButtonsProps = {
  onQuery?: () => void
  onReset?: () => void
}

export function QueryResetButtons({ onQuery, onReset }: QueryResetButtonsProps) {
  return (
    <Space>
      <Button type="primary" icon={<SearchOutlined />} onClick={onQuery}>
        查询
      </Button>
      <Button icon={<ReloadOutlined />} onClick={onReset}>
        重置
      </Button>
    </Space>
  )
}
