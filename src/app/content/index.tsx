'use client'
import {
  FC
} from 'react'
import InnerContent from './inner-content'
import { useSearchParams } from 'next/navigation'
import { ThemeProvider } from 'styled-components'
import { Provider as ReduxProvider } from 'react-redux'
import store from './store'
import { light } from '@/themes'

const Widget: FC = () => {
  const searchParams = useSearchParams()
  const parentUrl = searchParams.get('url')
  const decodedRedirectUrl = parentUrl ? decodeURIComponent(parentUrl) : ''

  const address = searchParams.get('address') || ''
  const apiKey = searchParams.get('apiKey') || ''
  const scope = searchParams.get('scope') || undefined

  console.log({
    decodedRedirectUrl,
    address,
    apiKey,
    scope
  })
  return <ThemeProvider theme={light}>
    <ReduxProvider store={store}>
      <InnerContent
        apiKey={apiKey}
        address={address}
        scope={scope}
        parentUrl={decodedRedirectUrl}
      />
    </ReduxProvider>
  </ThemeProvider>
}

export default Widget
