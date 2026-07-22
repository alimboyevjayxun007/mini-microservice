import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { api } from '../api/client';

type Device = {
  createdAt: string;
  deviceId: string;
  enabled: boolean;
  name: string;
  updatedAt: string;
};

type CreateDeviceForm = {
  deviceApiKey: string;
  deviceId: string;
  name: string;
};

const emptyCreateForm: CreateDeviceForm = {
  deviceApiKey: '',
  deviceId: '',
  name: '',
};

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [createForm, setCreateForm] = useState<CreateDeviceForm>(emptyCreateForm);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);

  const loadDevices = useCallback(async (): Promise<void> => {
    try {
      setError('');
      setDevices(await api<Device[]>('/devices'));
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  async function createDevice(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setBusyDeviceId('__create__');

    try {
      await api('/devices', {
        body: JSON.stringify(createForm),
        method: 'POST',
      });
      setCreateForm(emptyCreateForm);
      await loadDevices();
    } catch (createError) {
      setError((createError as Error).message);
    } finally {
      setBusyDeviceId(null);
    }
  }

  async function updateDevice(
    deviceId: string,
    update: { deviceApiKey?: string; enabled?: boolean; name?: string },
  ): Promise<void> {
    setError('');
    setBusyDeviceId(deviceId);

    try {
      await api(`/devices/${encodeURIComponent(deviceId)}`, {
        body: JSON.stringify(update),
        method: 'PATCH',
      });
      setEditingDeviceId(null);
      setEditApiKey('');
      await loadDevices();
    } catch (updateError) {
      setError((updateError as Error).message);
    } finally {
      setBusyDeviceId(null);
    }
  }

  async function deleteDevice(deviceId: string): Promise<void> {
    setError('');
    setBusyDeviceId(deviceId);

    try {
      await api(`/devices/${encodeURIComponent(deviceId)}`, { method: 'DELETE' });
      await loadDevices();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setBusyDeviceId(null);
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Boshqaruv</p>
          <h1>Devices</h1>
          <p className="muted">Device yaratish, tahrirlash, bloklash va o‘chirish.</p>
        </div>
        <button className="button button--secondary" onClick={loadDevices}>
          Yangilash
        </button>
      </header>

      <form className="panel device-form" onSubmit={createDevice}>
        <label>
          Device ID
          <input
            name="deviceId"
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, deviceId: event.target.value }))
            }
            pattern={'[a-zA-Z0-9._:\\-]+'}
            placeholder="esp32-01"
            required
            value={createForm.deviceId}
          />
        </label>

        <label>
          Nomi
          <input
            name="name"
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Reception device"
            required
            value={createForm.name}
          />
        </label>

        <label>
          Device API key
          <input
            minLength={4}
            name="deviceApiKey"
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                deviceApiKey: event.target.value,
              }))
            }
            placeholder="device-secret"
            required
            type="password"
            value={createForm.deviceApiKey}
          />
        </label>

        <button className="button" disabled={busyDeviceId === '__create__'} type="submit">
          {busyDeviceId === '__create__' ? 'Saqlanmoqda…' : 'Device qo‘shish'}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nomi</th>
              <th>Holat</th>
              <th>Yangilangan</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const editing = editingDeviceId === device.deviceId;
              const busy = busyDeviceId === device.deviceId;

              return (
                <tr data-device-id={device.deviceId} key={device.deviceId}>
                  <td className="mono">{device.deviceId}</td>
                  <td>
                    {editing ? (
                      <input
                        aria-label={`${device.deviceId} nomi`}
                        onChange={(event) => setEditName(event.target.value)}
                        required
                        value={editName}
                      />
                    ) : (
                      device.name
                    )}
                  </td>
                  <td>
                    <span className={`status status--${device.enabled ? 'enabled' : 'disabled'}`}>
                      {device.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>{new Date(device.updatedAt).toLocaleString('uz-UZ')}</td>
                  <td>
                    <div className="actions">
                      {editing ? (
                        <>
                          <input
                            aria-label={`${device.deviceId} yangi API key`}
                            minLength={4}
                            onChange={(event) => setEditApiKey(event.target.value)}
                            placeholder="Yangi key (ixtiyoriy)"
                            type="password"
                            value={editApiKey}
                          />
                          <button
                            className="button button--small"
                            disabled={busy}
                            onClick={() =>
                              updateDevice(device.deviceId, {
                                ...(editApiKey ? { deviceApiKey: editApiKey } : {}),
                                name: editName,
                              })
                            }
                          >
                            Saqlash
                          </button>
                          <button
                            className="button button--secondary button--small"
                            onClick={() => setEditingDeviceId(null)}
                          >
                            Bekor
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="button button--secondary button--small"
                            disabled={busy}
                            onClick={() => {
                              setEditingDeviceId(device.deviceId);
                              setEditName(device.name);
                              setEditApiKey('');
                            }}
                          >
                            Tahrirlash
                          </button>
                          <button
                            className="button button--secondary button--small"
                            disabled={busy}
                            onClick={() =>
                              updateDevice(device.deviceId, { enabled: !device.enabled })
                            }
                          >
                            {device.enabled ? 'Bloklash' : 'Yoqish'}
                          </button>
                          <button
                            className="button button--danger button--small"
                            disabled={busy}
                            onClick={() => deleteDevice(device.deviceId)}
                          >
                            O‘chirish
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && devices.length === 0 && (
              <tr>
                <td className="empty" colSpan={5}>
                  Device hali qo‘shilmagan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <p className="page-state">Yuklanmoqda…</p>}
      </div>
    </section>
  );
}
