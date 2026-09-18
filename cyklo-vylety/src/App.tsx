import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { TripDetail } from './pages/TripDetail'
import { TripForm } from './pages/TripForm'
import { TripList } from './pages/TripList'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="vylety" element={<TripList />} />
        <Route path="vylety/novy" element={<TripForm />} />
        <Route path="vylety/:id" element={<TripDetail />} />
        <Route path="vylety/:id/upravit" element={<TripForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
