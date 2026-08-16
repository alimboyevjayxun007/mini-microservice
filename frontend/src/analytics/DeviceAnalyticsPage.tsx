import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { api } from '../api/client';

type AnalyticsEvent = {
  deviceId: string;
  eventId: string;
  latencyMs: number;
  requestedAt: string;
  result: 'success' | 'rejected' | 'error';
};

type DeviceEventsResponse = {
  deviceId: string;
  events: AnalyticsEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const resultLabels: Record<AnalyticsEvent['result'], string> = {
  error: 'Error',
  rejected: 'Rejected',
  success: 'Connect',
};

export function DeviceAnalyticsPage() {
  const { deviceId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [data, setData] = useState<DeviceEventsResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async (): Promise<void> => {
    try {
      setError('');
      setLoading(true);
      const nextData = await api<DeviceEventsResponse>(
        `/analytics/devices/${encodeURIComponent(deviceId)}?page=${page}`,
      );
      setData(nextData);

      if (nextData.page !== page) {
        setSearchParams(nextData.page === 1 ? {} : { page: String(nextData.page) }, {
          replace: true,
        });
      }
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [deviceId, page, setSearchParams]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  function goToPage(nextPage: number): void {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
  }

  return (
    <section>
      <Link className="back-link" to="/analytics">
        ← Analytics’ga qaytish
      </Link>

      <header className="page-header device-analytics-header">
        <div>
          <p className="eyebrow">Device so‘rovlari</p>
          <h1 className="mono device-title">{deviceId}</h1>
          <p className="muted">
            Barcha connection urinishlari eng yangisidan boshlab, har sahifada 20 tadan.
          </p>
        </div>
        <button className="button button--secondary" disabled={loading} onClick={loadEvents}>
          {loading ? 'Yuklanmoqda…' : 'Yangilash'}
        </button>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {data && (
        <div className="detail-summary panel">
          <span>Jami so‘rov</span>
          <strong>{data.total}</strong>
          <span>
            {data.totalPages === 0
              ? 'Sahifa mavjud emas'
              : `${data.page} / ${data.totalPages} sahifa`}
          </span>
        </div>
      )}

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>So‘rov vaqti</th>
              <th>Natija</th>
              <th>Latency</th>
              <th>Event ID</th>
            </tr>
          </thead>
          <tbody>
            {data?.events.map((event) => (
              <tr key={event.eventId}>
                <td>{new Date(event.requestedAt).toLocaleString('uz-UZ')}</td>
                <td>
                  <span className={`status status--${event.result}`}>
                    {resultLabels[event.result]}
                  </span>
                </td>
                <td>{event.latencyMs} ms</td>
                <td className="mono event-id">{event.eventId}</td>
              </tr>
            ))}

            {!loading && data?.events.length === 0 && (
              <tr>
                <td className="empty" colSpan={4}>
                  Bu device uchun so‘rovlar hali mavjud emas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && !data && <p className="page-state">Yuklanmoqda…</p>}
      </div>

      {data && data.totalPages > 1 && (
        <nav aria-label="Connection sahifalari" className="pagination">
          <button
            className="button button--secondary"
            disabled={data.page <= 1 || loading}
            onClick={() => goToPage(data.page - 1)}
          >
            ← Oldingi
          </button>
          <span>
            {data.page}-sahifa, jami {data.totalPages}
          </span>
          <button
            className="button button--secondary"
            disabled={data.page >= data.totalPages || loading}
            onClick={() => goToPage(data.page + 1)}
          >
            Keyingi →
          </button>
        </nav>
      )}
    </section>
  );
}
