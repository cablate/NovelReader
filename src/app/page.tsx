"use client"

import { CircularProgress } from '@material-ui/core'
import { useRouter } from 'next/navigation'
import { use, useEffect } from 'react'
export default function App() {
  const router = useRouter()

  useEffect(() => {
    router.push('/recent')
  }, [])
  
  return (
    <CircularProgress className="m-auto"/>
  )
}
