import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { WalletProvider } from './hooks/useWallet'
import { ToastProvider } from './components/Toast'
import Landing from './pages/Landing'
import Verify from './pages/Verify'
import IssuerDashboard from './pages/IssuerDashboard'
import IssueCredential from './pages/IssueCredential'
import IssuerCertificates from './pages/IssuerCertificates'
import StudentDashboard from './pages/StudentDashboard'
import CertificateDetail from './pages/CertificateDetail'

export default function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:id" element={<Verify />} />
            <Route path="/verify/wallet/:address" element={<Verify />} />
            <Route path="/issuer" element={<IssuerDashboard />} />
            <Route path="/issuer/issue" element={<IssueCredential />} />
            <Route path="/issuer/certificates" element={<IssuerCertificates />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/certificates/:id" element={<CertificateDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </WalletProvider>
    </ToastProvider>
  )
}
