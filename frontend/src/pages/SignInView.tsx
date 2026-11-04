import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/api';
import './SignInView.css';

type AuthView =
  | 'login'
  | 'signup'
  | 'verify-signup'
  | 'approval-pending'
  | 'forgot-password'
  | 'verify-reset'
  | 'reset-password'
  | 'save-credentials';

interface SignInViewProps {
  onSignIn: (token: string) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({ onSignIn }) => {
  const [view, setView] = useState<AuthView>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('greencorridor.email') || '');
  const [jobTitle, setJobTitle] = useState('');
  const [accountRole, setAccountRole] = useState<'employee' | 'admin'>('employee');
  const [department, setDepartment] = useState<'PSCA' | '1122'>('1122');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsWorking(true);
    try {
      if (view === 'login') {
        const result = await apiService.login(email, password, accountRole, department);
        setPendingToken(result.access_token);
        setPendingEmail(email);
        setPassword('');
        setShowPassword(false);
        setView('save-credentials');
      } else if (view === 'signup') {
        const result = await apiService.requestSignupOtp({
          full_name: fullName,
          email,
          job_title: jobTitle,
          password,
          role: accountRole,
          department,
        });
        setChallengeId(result.challenge_id);
        setOtp('');
        setMessage(result.message);
        setView('verify-signup');
      } else if (view === 'verify-signup') {
        const result = await apiService.verifySignupOtp(email, challengeId, otp);
        setPassword('');
        setShowPassword(false);
        if (result.status === 'pending_approval') {
          setMessage(result.message);
          setView('approval-pending');
        } else {
          setPendingToken(result.access_token);
          setPendingEmail(email);
          setView('save-credentials');
        }
      } else if (view === 'forgot-password') {
        const result = await apiService.requestPasswordReset(email);
        setChallengeId(result.challenge_id);
        setOtp('');
        setMessage(result.message);
        setView('verify-reset');
      } else if (view === 'verify-reset') {
        const result = await apiService.verifyResetOtp(email, challengeId, otp);
        setResetToken(result.reset_token);
        setPassword('');
        setConfirmPassword('');
        setView('reset-password');
      } else if (view === 'reset-password') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const result = await apiService.resetPassword(resetToken, password);
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        setChallengeId('');
        setView('login');
        setMessage(`${result.message} Sign in with your new password.`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication request failed');
    } finally {
      setIsWorking(false);
    }
  };

  const finishSignIn = (rememberEmail: boolean) => {
    if (rememberEmail) {
      localStorage.setItem('greencorridor.email', pendingEmail);
    } else {
      localStorage.removeItem('greencorridor.email');
    }
    apiService.setAuthToken(pendingToken);
    onSignIn(pendingToken);
  };

  const showLogin = () => {
    setView('login');
    setChallengeId('');
    setOtp('');
    setResetToken('');
    setError('');
    setMessage('');
  };

  return (
    <div className="auth-shell">
      <div className="auth-intro">
        <div className="auth-brand">
          <svg className="auth-brand-mark" viewBox="0 0 40 40" role="img" aria-label="GreenCorridor AI logo">
            <rect x="2" y="2" width="36" height="36" rx="4" fill="var(--accent-gold)" />
            <path d="M9 20h22" stroke="var(--navy-900)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="13" cy="20" r="3.4" fill="var(--navy-900)" />
            <circle cx="20" cy="20" r="3.4" fill="var(--navy-900)" />
            <circle cx="27" cy="20" r="3.4" fill="var(--navy-900)" />
          </svg>
          <div className="auth-brand-copy">
            <span style={{ fontWeight: 700, fontSize: '18px' }}>GreenCorridor AI</span>
            <span className="auth-brand-subtitle" style={{ fontSize: '12px' }}>Emergency vehicle priority layer</span>
          </div>
        </div>

        <div className="auth-intro-copy">
          <span className="auth-eyebrow">
            FINAL YEAR PROJECT · UMT LAHORE
          </span>
          <h1 className="auth-title">
            A moving green corridor for every emergency.
          </h1>
          <p className="auth-description">
            An AI decision layer that routes the ambulance, predicts when it reaches each junction, and prepares
            signals ahead of it, with every command checked by a safety validator.
          </p>

          <svg className="auth-corridor" viewBox="0 0 600 170" role="img" aria-label="Corridor strip illustration">
            <rect x="20" y="82" width="560" height="14" rx="2" fill="var(--navy-700)" />
            <rect x="20" y="82" width="190" height="14" rx="2" fill="var(--success)" />
            <rect x="8" y="64" width="46" height="50" rx="4" fill="var(--navy-900)" stroke="var(--danger)" strokeWidth="2" />
            <path d="M31 78v22M20 89h22" stroke="var(--danger)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="31" cy="89" r="22" fill="none" stroke="var(--danger)" strokeWidth="2" />
            <g fontFamily="'IBM Plex Sans', sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
              <circle cx="170" cy="89" r="17" fill="var(--success)" /><text x="170" y="93" fill="#FFFFFF">I1</text>
              <circle cx="285" cy="89" r="17" fill="var(--accent-gold)" /><text x="285" y="93" fill="var(--navy-900)">I2</text>
              <circle cx="400" cy="89" r="17" fill="var(--navy-600)" /><text x="400" y="93" fill="#FFFFFF">I3</text>
              <circle cx="500" cy="89" r="17" fill="var(--navy-600)" /><text x="500" y="93" fill="#FFFFFF">I4</text>
              <rect x="548" y="64" width="46" height="50" rx="4" fill="var(--navy-900)" /><text x="571" y="95" fontSize="20" fill="#FFFFFF">H</text>
              <text x="170" y="52" fill="#FFFFFF">GREEN</text>
              <text x="285" y="52" fill="var(--accent-gold)">PREPARING</text>
              <text x="400" y="52" fill="#E7EFF8">MONITOR</text>
              <text x="500" y="52" fill="#E7EFF8">MONITOR</text>
              <g fontFamily="'IBM Plex Mono', monospace" fontWeight="500" fill="#FFFFFF">
                <text x="170" y="132">ETA 12 s</text><text x="285" y="132">ETA 40 s</text><text x="400" y="132">ETA 85 s</text><text x="500" y="132">ETA 130 s</text>
              </g>
            </g>
          </svg>
        </div>

        <div className="auth-intro-footer">
          <span>Muhammad Ahmad Asif · Muhammad Taimoor Nasir · Muhammad Usman Danial</span>
          <span>Advisor: Prof. Hafiz Ahsan Arshad · Co-advisor: Dr. Muhammad Husnain Ashfaq</span>
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          {view === 'approval-pending' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Request submitted</h2>
                <span role="status" className="auth-heading-copy">
                  {message}
                </span>
              </div>
              <button type="button" className="btn-p" style={{ width: '100%' }} onClick={showLogin}>
                Return to sign in
              </button>
            </div>
          ) : view === 'save-credentials' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Save your credentials?</h2>
                <span className="auth-heading-copy">
                  Remember {pendingEmail} on this device for your next sign-in. Your password is never saved in the browser.
                </span>
              </div>
              <button type="button" className="btn-p" style={{ width: '100%' }} onClick={() => finishSignIn(true)}>
                Remember email and continue
              </button>
              <button type="button" className="btn-g" style={{ width: '100%' }} onClick={() => finishSignIn(false)}>
                Do not save and continue
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
                  {view === 'login' ? `${accountRole === 'admin' ? 'Admin' : 'Employee'} sign in`
                    : view === 'signup' ? 'Create your account'
                      : view === 'verify-signup' ? 'Verify your email'
                        : view === 'forgot-password' ? 'Forgot password'
                          : view === 'verify-reset' ? 'Verify reset code'
                            : 'Choose a new password'}
                </h2>
                <span className="auth-heading-copy">
                  {view === 'login' ? `Sign in with your ${department} ${accountRole === 'admin' ? 'admin' : 'employee'} account.`
                    : view === 'signup' ? `Create a ${department} ${accountRole === 'admin' ? 'admin' : 'employee'} account.`
                      : view === 'verify-signup' ? `Enter the six-digit code sent to ${email}.`
                        : view === 'forgot-password' ? 'Enter the official email address on your account.'
                          : view === 'verify-reset' ? `Enter the reset code sent to ${email}.`
                            : 'Enter and confirm your new password.'}
                </span>
              </div>

              {['login', 'signup'].includes(view) && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="account-type" className="auth-form-label">Account type</label>
                    <select id="account-type" className="field" value={accountRole} onChange={(event) => setAccountRole(event.target.value === 'admin' ? 'admin' : 'employee')}>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="department" className="auth-form-label">Department</label>
                    <select id="department" className="field" value={department} onChange={(event) => setDepartment(event.target.value === 'PSCA' ? 'PSCA' : '1122')}>
                      <option value="PSCA">PSCA</option>
                      <option value="1122">1122</option>
                    </select>
                  </div>
                  {view === 'signup' && accountRole === 'admin' && (
                    <span className="auth-notice">
                      Admin registration is restricted to configured administrator email addresses.
                    </span>
                  )}
                </>
              )}

              {view === 'signup' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="full-name" className="auth-form-label">Full name</label>
                    <input id="full-name" className="field" type="text" autoComplete="name" maxLength={120} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="job-title" className="auth-form-label">Job title</label>
                    <input id="job-title" className="field" type="text" autoComplete="organization-title" maxLength={120} required value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
                  </div>
                </>
              )}

              {['login', 'signup', 'forgot-password'].includes(view) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="official-email" className="auth-form-label">Official email address</label>
                  <input id="official-email" className="field" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              )}

              {view === 'login' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="login-password" className="auth-form-label">Password</label>
                    <div className="auth-password-wrap">
                      <input id="login-password" className="field" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                  <button type="button" className="btn-g" style={{ alignSelf: 'flex-end' }} onClick={() => { setView('forgot-password'); setError(''); setMessage(''); }}>
                    Forgot password?
                  </button>
                </>
              )}

              {view === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="signup-password" className="auth-form-label">Password</label>
                  <div className="auth-password-wrap">
                    <input id="signup-password" className="field" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  <span className="auth-helper">Use at least 8 characters.</span>
                </div>
              )}

              {(view === 'verify-signup' || view === 'verify-reset') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="otp-code" className="auth-form-label">Six-digit verification code</label>
                  <input id="otp-code" className="field" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} />
                </div>
              )}

              {view === 'reset-password' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="new-password" className="auth-form-label">New password</label>
                    <div className="auth-password-wrap">
                      <input id="new-password" className="field" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="confirm-password" className="auth-form-label">Confirm new password</label>
                    <div className="auth-password-wrap">
                      <input id="confirm-password" className="field" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showConfirmPassword}
                        onClick={() => setShowConfirmPassword((visible) => !visible)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {message && <span role="status" className="auth-status">{message}</span>}
              {error && <span role="alert" className="auth-error">{error}</span>}

              <button type="submit" className="btn-p" style={{ width: '100%' }} disabled={isWorking}>
                {isWorking ? 'Please wait...'
                  : view === 'login' ? 'Sign in'
                    : view === 'signup' ? 'Continue to email verification'
                      : view === 'verify-signup' ? 'Verify and create account'
                        : view === 'forgot-password' ? 'Send reset code'
                          : view === 'verify-reset' ? 'Verify code'
                            : 'Update password'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="auth-submit-arrow" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>

              {view === 'login' && (
                <button type="button" className="btn-g" onClick={() => { setView('signup'); setError(''); setMessage(''); }}>
                  New {accountRole === 'admin' ? 'admin' : 'employee'}? Create an account
                </button>
              )}
              {view === 'signup' && (
                <button type="button" className="btn-g" onClick={showLogin}>Back to sign in</button>
              )}
              {view !== 'login' && view !== 'signup' && (
                <button type="button" className="btn-g" onClick={showLogin}>Back to sign in</button>
              )}
              <span className="auth-helper">
                Email codes are sent to your address. Passwords are hashed in the backend; browser storage remembers only your email if you choose.
              </span>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
