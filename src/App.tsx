import { Navigate, Route, Routes } from 'react-router-dom'
import { Failed, Loading, Panel } from '@/components/kit'
import { Shell } from '@/components/shell'
import { useAuth } from '@/features/auth/auth-context'
import { useContractorContext } from '@/features/contractors/contractor-context'
import { DashboardPage } from '@/pages/dashboard-page'
import { LoginPage } from '@/pages/login-page'
import { OnboardingPage } from '@/pages/onboarding-page'
import { ProfilePage } from '@/pages/profile-page'
import { ServicesPage } from '@/pages/services-page'
import { TeamPage } from '@/pages/team-page'

/** Sin sesión → login. Con sesión pero sin empresa → registro de empresa. Con empresa → el portal. */
function PortalArea() {
  const { status } = useAuth()
  const { contractor, isLoading, isError } = useContractorContext()
  if (status === 'loading' || isLoading) return <div className="p-8"><Loading rows={4} /></div>
  if (status === 'anonymous') return <Navigate to="/login" replace />
  if (isError) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Panel><Failed what="tus empresas" onRetry={() => window.location.reload()} /></Panel>
      </div>
    )
  }
  if (!contractor) return <OnboardingPage />
  return <Shell />
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<PortalArea />}>
        <Route index element={<DashboardPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
