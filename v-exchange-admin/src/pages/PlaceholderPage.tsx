import { PageFrame } from '../components/PageFrame'

type PlaceholderPageProps = {
  message?: string
}

export function PlaceholderPage({ message = 'Under Development' }: PlaceholderPageProps) {
  return (
    <PageFrame>
      <div style={{ padding: 48, textAlign: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 16 }}>
        {message}
      </div>
    </PageFrame>
  )
}
