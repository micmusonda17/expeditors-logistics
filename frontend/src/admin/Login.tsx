import { useState, type FormEvent } from 'react';
import { api, ApiError, type User } from '../api';
import { COMPANY, IS_DEMO } from '../config';

export function Login({ onSignedIn }: { onSignedIn(u: User): void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try { onSignedIn(await api.login(email.trim(), password)); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Sign-in did not complete. Try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="pt-login">
      <div className="pt-login-card">
        <img src="assets/img/emblem.png" alt="" className="pt-login-art" width={916} height={314} />
        <p className="eyebrow">Operations portal</p>
        <h1 className="display">Staff sign in</h1>
        <p className="muted">Quotes, loads and tracking updates for the {COMPANY.shortName} team.</p>
        {error && <p className="notice">{error}</p>}
        {IS_DEMO ? (
          <>
            <button className="btn btn-red" type="button" onClick={() => api.login('', '').then(onSignedIn)}>Enter the demo portal</button>
            <p className="small muted">This preview uses sample data stored only in your browser. In the live version each family member signs in with their own email and password.</p>
          </>
        ) : (
          <form className="pt-login-form" onSubmit={submit}>
            <div className="field"><label htmlFor="lg-email">Email</label><input id="lg-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="field"><label htmlFor="lg-password">Password</label><input id="lg-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <button className="btn btn-red" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          </form>
        )}
        <a className="pt-link" href="#top">← Back to the website</a>
      </div>
    </div>
  );
}
