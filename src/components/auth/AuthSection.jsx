import { useState } from 'react';

const authHighlights = [
  'Save your profile for quick access',
  'Keep your planner ready every session',
  'Jump back into routes without re-entering details'
];

export default function AuthSection({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetStatus = () => setStatus({ type: '', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetStatus();

    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsSubmitting(true);
    let result;
    try {
      result = mode === 'signin'
        ? await onSignIn(email.trim(), password)
        : await onSignUp(name.trim(), email.trim(), password);
    } catch {
      result = { ok: false, message: 'Unable to complete authentication right now.' };
    } finally {
      setIsSubmitting(false);
    }

    setStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message
    });
  };

  return (
    <section className="planner-page auth-page" id="auth" aria-label="Authentication">
      <div className="container">
        <div className="page-title">
          <h1>Welcome Back</h1>
          <p>Sign in to your account or create one to keep your profile ready.</p>
        </div>

        <div className="auth-shell">
          <div className="auth-aside">
            <h2>{mode === 'signin' ? 'Sign in and continue your trip' : 'Create your Metroom account'}</h2>
            <p>
              {mode === 'signin'
                ? 'Access your profile and continue planning in seconds.'
                : 'Set up your account once and keep your metro planning experience personalized.'}
            </p>
            <ul className="auth-highlights">
              {authHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="auth-form-shell">
            <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                className={`auth-toggle-btn ${mode === 'signin' ? 'active' : ''}`}
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  resetStatus();
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => {
                  setMode('signup');
                  resetStatus();
                }}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <label>
                  <span>Full Name</span>
                  <input
                    className="auth-input"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </label>
              ) : null}

              <label>
                <span>Email</span>
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </label>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>

              {status.message ? (
                <p className={`auth-status ${status.type === 'error' ? 'error' : 'success'}`} role="status" aria-live="polite">
                  {status.message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
