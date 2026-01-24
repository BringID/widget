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
import PlausibleProvider from 'next-plausible'
import configs from '../configs'

const Widget: FC = () => {
  const searchParams = useSearchParams()
  const parentUrl = searchParams.get('url')
  const decodedRedirectUrl = parentUrl ? decodeURIComponent(parentUrl) : ''

  const address = searchParams.get('address') || ''
  const apiKey = searchParams.get('apiKey') || ''

  const mode = searchParams.get('mode') || 'production'

  return <PlausibleProvider domain={configs.PLAUSIBLE_DOMAIN}>
    <ThemeProvider theme={light}>
      <ReduxProvider store={store}>
        <InnerContent
          apiKey={apiKey}
          address={address}
          parentUrl={decodedRedirectUrl}
          mode={mode}
        />
      </ReduxProvider>
    </ThemeProvider>
  </PlausibleProvider>
}

export default Widget
