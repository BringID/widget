'use server'
import './globals.css'
import styles from './page.module.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers' // added


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'BringID Connect'
  }
}
export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {

  const headersObj = await headers();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={styles.page}>
        {children}
      </body>
    </html>
  )
}