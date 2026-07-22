import { useCallback, useEffect, useState } from 'react';

import { api } from '../api/client';

type DeviceAnalytics = {
  averageLatencyMs: number;
  connects: number;
  deviceId: string;
  errors: number;
  lastRequestAt: string | null;
  rejected: number;
};

type Overview = {
  devices: Record<string, DeviceAnalytics>;
  errors: number;
  rejected: number;
  successful: number;
  total: number;
};

export function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async (): Promise<void> => {
    try {
      setError('');
      setData(await api<Overview>('/analytics/overview'));
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Audit</p>
          <h1>Analytics</h1>
          <p className="muted">
            Connect — credential tekshiruvidan o‘tib, conversation URL olgan so‘rov.
          </p>
        </div>
        <button className="button button--secondary" onClick={loadAnalytics}>
          Yangilash
        </button>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!data ? (
        <p className="page-state">Yuklanmoqda…</p>
      ) : (
        <>
          <div className="cards">
            <article className="metric panel">
              <span>Jami</span>
              <strong>{data.total}</strong>
            </article>
            <article className="metric panel">
              <span>Connect</span>
              <strong>{data.successful}</strong>
            </article>
            <article className="metric panel">
              <span>Rejected</span>
              <strong>{data.rejected}</strong>
            </article>
            <article className="metric panel">
              <span>Error</span>
              <strong>{data.errors}</strong>
            </article>
          </div>

          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Connect</th>
                  <th>Rejected</th>
                  <th>Error</th>
                  <th>O‘rtacha latency</th>
                  <th>Oxirgi so‘rov</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(data.devices).map((device) => (
                  <tr key={device.deviceId}>
                    <td className="mono">{device.deviceId}</td>
                    <td>{device.connects}</td>
                    <td>{device.rejected}</td>
                    <td>{device.errors}</td>
                    <td>{device.averageLatencyMs} ms</td>
                    <td>
                      {device.lastRequestAt
                        ? new Date(device.lastRequestAt).toLocaleString('uz-UZ')
                        : '—'}
                    </td>
                  </tr>
                ))}

                {Object.keys(data.devices).length === 0 && (
                  <tr>
                    <td className="empty" colSpan={6}>
                      Analytics hodisalari hali mavjud emas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
