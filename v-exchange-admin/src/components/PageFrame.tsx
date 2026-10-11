import type { ReactNode } from 'react'
import { AdminWatermark } from './AdminWatermark'
import './PageFrame.css'

type PageFrameProps = {
  title?: string
  children: ReactNode
  extra?: ReactNode
}

export function PageFrame({ title, children, extra }: PageFrameProps) {
  return (
    <div className="page-frame">
      <AdminWatermark />
      <div className="page-frame-inner">
        {(title || extra) && (
          <div className="page-frame-header">
            {title ? <h3 className="page-frame-title">{title}</h3> : <span />}
            {extra}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
