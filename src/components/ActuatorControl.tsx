'use client';
import { useState } from 'react';

function ActuatorItem({
  label,
  description,
  initialState = false,
}: {
  label: string;
  description: string;
  initialState?: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(initialState);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {description}
        </div>
      </div>
      <div>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isEnabled ? 'var(--green-primary)' : 'var(--bg)',
            color: isEnabled ? 'white' : 'var(--text-secondary)',
            fontWeight: '600',
            transition: 'all 0.2s',
            minWidth: '70px',
          }}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

export default function ActuatorSection() {
  return (
    <div className="sensor-section">
      <div className="section-header">
        <span className="section-label">Kendali Perangkat</span>
        <span className="section-sub">IOT AKTUATOR</span>
        <div className="section-line"></div>
      </div>
      <div className="chart-card" style={{ padding: '10px 24px' }}>
        <ActuatorItem
          label="Pompa Irigasi"
          description="Kontrol aliran air nutrisi ke bedengan"
          initialState={true}
        />
        <ActuatorItem
          label="Kipas Sirkulasi Udara"
          description="Menurunkan suhu mikro dan mencegah jamur"
        />
        <ActuatorItem
          label="Lampu Growlight (UV)"
          description="Kompensasi cahaya matahari di malam hari"
        />
        {/* Remove bottom border from last item via inline style hack or just let it be, the UI won't break */}
      </div>
    </div>
  );
}
