'use client'
import {
  FC
} from 'react'
import InnerContent from './inner-content'
import { useSearchParams } from 'next/navigation'
import { ThemeProvider } from 'styled-components'
import { Provider as ReduxProvider } from 'react-redux'
import store from './store'
import { dark, light } from '@/themes'
import PlausibleProvider from 'next-plausible'
import configs from '../configs'
import { lightenHex } from '@/utils'

const Widget: FC = () => {
  const searchParams = useSearchParams()
  const parentUrl = searchParams.get('url')
  const decodedRedirectUrl = parentUrl ? decodeURIComponent(parentUrl) : ''

  const address = searchParams.get('address') || ''
  const apiKey = searchParams.get('apiKey') || ''
  const themeParam = searchParams.get('theme') || 'light'
  const defaultTheme = themeParam === 'dark' ? dark : light

  const highlightColor = searchParams.get('highlightColor') ? decodeURIComponent(searchParams.get('highlightColor') as string) : undefined
  const customTitlesParam = searchParams.get('customTitles')
  const customTitles = customTitlesParam ? (() => {
    try {
      return JSON.parse(decodeURIComponent(customTitlesParam))
    } catch {
      return undefined
    }
  })() : undefined

  console.log({ ...dark, highlightColor, searchParams })

  const finalTheme = { ...defaultTheme }

  if (highlightColor) {
    finalTheme.highlightColor = highlightColor
    finalTheme.buttonDisabledBackgroundColor = lightenHex(highlightColor)
  }

  return <PlausibleProvider domain={configs.PLAUSIBLE_DOMAIN}>
    <ThemeProvider theme={finalTheme}>
      <ReduxProvider store={store}>
        <InnerContent
          apiKey={apiKey}
          address={address}
          parentUrl={decodedRedirectUrl}
          customTitles={customTitles}
        />
      </ReduxProvider>
    </ThemeProvider>
  </PlausibleProvider>
}

export default Widget
