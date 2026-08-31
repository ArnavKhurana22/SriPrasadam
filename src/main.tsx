import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/auth'
import AdminPage from './pages/AdminPage'
import BookingPage from './pages/BookingPage'
import ContactPage from './pages/ContactPage'
import EventsPage from './pages/EventsPage'
import HomePage from './pages/HomePage'
import MyBookingsPage from './pages/MyBookingsPage'
import NotFoundPage from './pages/NotFoundPage'
import PoojaPage from './pages/PoojaPage'
import TrackPage from './pages/TrackPage'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="pooja" element={<PoojaPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="book" element={<BookingPage />} />
            <Route path="my-bookings" element={<MyBookingsPage />} />
            <Route path="track" element={<TrackPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
