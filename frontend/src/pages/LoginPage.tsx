import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await auth.login(username, password);
      navigate('/devices', { replace: true });
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <form className="panel login__form" onSubmit={submit}>
        <p className="eyebrow">ElevenLabs device gateway</p>
        <h1>Admin panelga kirish</h1>

        <label>
          Login
          <input
            autoComplete="username"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
        </label>

        <label>
          Parol
          <input
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <button className="button" disabled={submitting} type="submit">
          {submitting ? 'Tekshirilmoqda…' : 'Kirish'}
        </button>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
