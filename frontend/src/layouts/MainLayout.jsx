import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StatusStrip from '../components/StatusStrip'
import NetworkSwitchModal from '../components/NetworkSwitchModal'

export default function MainLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <StatusStrip />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <NetworkSwitchModal />
    </div>
  )
}
