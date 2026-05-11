'use client';
import WeatherSection from '../components/WeatherSection';
import ActuatorSection from '../components/ActuatorControl';

export default function Page() {
  return (
    <>
      {/* ═══════════ LOGIN PAGE ═══════════ */}
      <div className="login-page" id="login-page" suppressHydrationWarning>
        <div className="login-card">
          <div className="login-logo">
            <span className="login-logo-icon">🌾</span>
            <h2>
              Agri<span>Sense</span>
            </h2>
            <p>Smart Farm Monitoring System</p>
          </div>

          <form
            className="login-form"
            id="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') (window as any).handleLogin(e);
            }}
          >
            <div className="form-group">
              <label htmlFor="login-user">Username</label>
              <input
                type="text"
                id="login-user"
                className="form-input"
                placeholder="Masukkan username"
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-pass">Password</label>
              <input
                type="password"
                id="login-pass"
                className="form-input"
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="login-error" id="login-error">
              Username atau password salah
            </div>
            <button type="submit" className="login-btn">
              Masuk
            </button>
          </form>

          <div className="login-footer">© 2026 AgriSense · Monitoring Pertanian Cerdas</div>
        </div>
      </div>

      {/* ═══════════ DASHBOARD ═══════════ */}
      <div className="dashboard" id="dashboard" suppressHydrationWarning>
        <div className="container">
          {/* Header */}
          <header>
            <div className="header-left">
              <span className="header-icon">🌾</span>
              <div>
                <h1>
                  Agri<span>Sense</span>
                </h1>
                <p>Smart Farm Monitoring</p>
              </div>
            </div>
            <div className="header-right">
              <div className="status-pill" id="status-pill" suppressHydrationWarning>
                <span className="status-dot" suppressHydrationWarning></span>
                <span id="conn-label" suppressHydrationWarning>
                  Menghubungkan...
                </span>
              </div>
              <button
                className="theme-switch"
                id="btn-theme-toggle"
                type="button"
                onClick={() => typeof window !== 'undefined' && (window as any).toggleTheme()}
                title="Ganti mode tampilan"
                aria-label="Aktifkan dark mode"
                aria-pressed="false"
                suppressHydrationWarning
              >
                <span
                  className="theme-switch-label"
                  id="theme-toggle-label"
                  suppressHydrationWarning
                >
                  Dark
                </span>
                <span className="theme-switch-track" aria-hidden="true" suppressHydrationWarning>
                  <span
                    className="theme-switch-thumb"
                    id="theme-toggle-icon"
                    suppressHydrationWarning
                  >
                    ☀️
                  </span>
                </span>
              </button>
              <button
                className="btn-header-action"
                id="btn-refresh"
                onClick={() => typeof window !== 'undefined' && (window as any).handleRefresh()}
                title="Refresh data tanpa reload halaman"
              >
                Refresh
              </button>
              <div className="user-badge" suppressHydrationWarning>
                <span className="user-avatar" suppressHydrationWarning>
                  AG
                </span>
                <span id="user-display-name" suppressHydrationWarning>
                  User
                </span>
              </div>
              <button
                className="btn-logout"
                onClick={() => typeof window !== 'undefined' && (window as any).handleLogout()}
              >
                Keluar
              </button>
            </div>
          </header>

          {/* Info Bar */}
          <div className="info-bar" suppressHydrationWarning>
            <div className="info-bar-left" suppressHydrationWarning>
              <span
                id="last-update"
                style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                suppressHydrationWarning
              >
                –
              </span>
              <span className="conn-badge" id="conn-badge" suppressHydrationWarning>
                MQTT
              </span>
            </div>
          </div>

          {/* Alerts */}
          <div
            id="alert-container"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: '' }}
          ></div>

          {/* CUACA LOKAL */}
          <WeatherSection />

          {/* Sensor Sections (Generated Dynamically) */}
          <div
            id="sensor-sections"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: '' }}
          ></div>

          {/* Chart Sections (Generated Dynamically) */}
          <div
            id="chart-sections"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: '' }}
          ></div>

          {/* KENDALI PERANGKAT */}
          <ActuatorSection />

          {/* Smart Recommendation */}
          <div className="sensor-section">
            <div className="section-header">
              <span className="section-label">Rekomendasi Tanam</span>
              <span className="section-sub">Berdasarkan kondisi sensor saat ini</span>
              <div className="section-line"></div>
            </div>
            <div className="chart-card" id="recommendation-panel" suppressHydrationWarning>
              <div
                id="recommendation-content"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                  __html:
                    '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">Menunggu data sensor...</p>',
                }}
              ></div>
            </div>
          </div>

          {/* Threshold (admin only) */}
          <div
            className="chart-card"
            id="threshold-section"
            style={{ display: 'none' }}
            suppressHydrationWarning
          >
            <div className="chart-header">
              <span className="chart-title">Batas Peringatan</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  id="btn-edit-thr"
                  onClick={() =>
                    typeof window !== 'undefined' && (window as any).toggleEditThreshold(true)
                  }
                >
                  Edit
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  id="btn-cancel-thr"
                  onClick={() =>
                    typeof window !== 'undefined' &&
                    (window as any).toggleEditThreshold(false, true)
                  }
                  style={{ display: 'none' }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-green btn-sm"
                  id="btn-save-thr"
                  onClick={() =>
                    typeof window !== 'undefined' && (window as any).saveThresholdsButtonClick()
                  }
                  style={{ display: 'none' }}
                >
                  Simpan
                </button>
              </div>
            </div>
            <div
              className="threshold-grid"
              id="thr-container"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: '' }}
            ></div>
          </div>

          {/* Log */}
          <div className="log-card">
            <div className="log-header">
              <span className="log-title">Event Log</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => typeof window !== 'undefined' && (window as any).clearLog()}
              >
                Clear
              </button>
            </div>
            <div
              id="log-body"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: '' }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}
