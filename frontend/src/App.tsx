import { Navigate, NavLink, Route, Routes } from 'react-router-dom';

import { AnalyticsPage } from './analytics/AnalyticsPage';
import { DeviceAnalyticsPage } from './analytics/DeviceAnalyticsPage';
import { useAuth } from './auth/AuthProvider';
import { DevicesPage } from './devices/DevicesPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const auth = useAuth();

  if (auth.status === 'checking') {
    return <div className="page-state">Sessiya tekshirilmoqda…</div>;
  }

  const authenticated = auth.status === 'authenticated';

  return (
    <>
      <nav className="navigation">
        <b className="navigation__brand">Mini Admin</b>
        {authenticated && (
          <>
            <NavLink to="/devices">Devices</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </>
        )}
        <a
          className="button button--secondary navigation__swagger"
          href="/api/swagger"
          rel="noreferrer"
          target="_blank"
        >
          Swagger
        </a>
        {authenticated && (
          <button className="button button--secondary navigation__logout" onClick={auth.logout}>
            Chiqish
          </button>
        )}
      </nav>

      <div className={authenticated ? 'container' : undefined}>
        <Routes>
          <Route
            element={authenticated ? <Navigate replace to="/devices" /> : <LoginPage />}
            path="/login"
          />
          <Route
            element={authenticated ? <DevicesPage /> : <Navigate replace to="/login" />}
            path="/devices"
          />
          <Route
            element={authenticated ? <AnalyticsPage /> : <Navigate replace to="/login" />}
            path="/analytics"
          />
          <Route
            element={authenticated ? <DeviceAnalyticsPage /> : <Navigate replace to="/login" />}
            path="/analytics/devices/:deviceId"
          />
          <Route
            element={<Navigate replace to={authenticated ? '/devices' : '/login'} />}
            path="*"
          />
        </Routes>
      </div>
    </>
  );
}
