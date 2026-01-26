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
import { lightenHex } from '@/utils'

const Widget: FC = () => {
  const searchParams = useSearchParams()
  const parentUrl = searchParams.get('url')
  const decodedRedirectUrl = parentUrl ? decodeURIComponent(parentUrl) : ''

  const address = searchParams.get('address') || ''
  const apiKey = searchParams.get('apiKey') || ''

  const mode = searchParams.get('mode') || 'production'

  const highlightColor = searchParams.get('highlightColor') ? decodeURIComponent(searchParams.get('highlightColor') as string) : '#6B43F4'

  console.log({ ...light, highlightColor, searchParams })
  return <PlausibleProvider domain={configs.PLAUSIBLE_DOMAIN}>
    <ThemeProvider theme={{
        ...light,
        highlightColor,
        buttonDisabledBackgroundColor: lightenHex(highlightColor)
      }}>
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
