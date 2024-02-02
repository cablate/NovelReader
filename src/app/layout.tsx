import Layout from '@/components/Layout'
import './globals.css'
import { QueryClient, QueryClientProvider} from '@tanstack/react-query'
import QueryClientProvide from '@/utility/queryClient'
import { Suspense, lazy } from 'react'
import Loading from './loading'
import PageNameProvider from './_Provider/PageNameProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const LazyLayout = lazy(() => import('@/components/Layout'))

  return (
    <html lang="en">
      <head>
		  	<meta name="description" content="Easy Novel Reader" />
		  	<meta name="viewport" content="width=device-width, initial-scale=1" />
		  	<link rel="icon" href="/favicon.ico" />
		  </head>
      <body>
        <QueryClientProvide>
          <PageNameProvider>
            <Layout>
              {children}
            </Layout>
          </PageNameProvider>

        </QueryClientProvide>
      </body>
    </html>
  )
}
