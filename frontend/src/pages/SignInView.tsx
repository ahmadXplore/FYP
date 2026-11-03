import React, { useState } from 'react';
import { apiService } from '../services/api';

type AuthView =
  | 'login'
  | 'signup'
  | 'verify-signup'
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
        setPendingToken(result.access_token);
        setPendingEmail(email);
        setPassword('');
        setView('save-credentials');
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
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: '#0B1220' }}>
      {/* Left Column: FYP Presentation */}
      <div
        style={{
          flex: '1 1 560px',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '40px',
          background: '#0F1A2E',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" role="img" aria-label="GreenCorridor AI logo">
            <rect x="2" y="2" width="36" height="36" rx="10" fill="#34D3A8" />
            <path d="M9 20h22" stroke="#06231C" strokeWidth="3" strokeLinecap="round" />
            <circle cx="13" cy="20" r="3.4" fill="#06231C" />
            <circle cx="20" cy="20" r="3.4" fill="#06231C" />
            <circle cx="27" cy="20" r="3.4" fill="#06231C" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 700, fontSize: '18px' }}>GreenCorridor AI</span>
            <span style={{ fontSize: '12px', color: '#A3B2CA' }}>Emergency vehicle priority layer</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: '#34D3A8' }}>
            FINAL YEAR PROJECT · UMT LAHORE
          </span>
          <h1 style={{ margin: 0, fontSize: '46px', lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.02em' }}>
            A moving green corridor for every emergency.
          </h1>
          <p style={{ margin: 0, fontSize: '17px', lineHeight: 1.55, color: '#A3B2CA' }}>
            An AI decision layer that routes the ambulance, predicts when it reaches each junction, and prepares
            signals ahead of it, with every command checked by a safety validator.
          </p>

          <svg viewBox="0 0 600 170" style={{ width: '100%', maxWidth: '600px', height: 'auto' }} role="img" aria-label="Corridor strip illustration">
            <rect x="20" y="82" width="560" height="14" rx="7" fill="#243350" />
            <rect x="20" y="82" width="190" height="14" rx="7" fill="#34D3A8" opacity="0.35" />
            <rect x="8" y="64" width="46" height="50" rx="10" fill="#0B1220" stroke="#FF7A7A" strokeWidth="2" />
            <path d="M31 78v22M20 89h22" stroke="#FF7A7A" strokeWidth="4" strokeLinecap="round" />
            <circle cx="31" cy="89" r="22" fill="none" stroke="#FF7A7A" strokeWidth="2" className="pulse" />
            <g fontFamily="'IBM Plex Sans', sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
              <circle cx="170" cy="89" r="17" fill="#34D3A8" /><text x="170" y="93" fill="#06231C">I1</text>
              <circle cx="285" cy="89" r="17" fill="#F6B93B" /><text x="285" y="93" fill="#2A1E00">I2</text>
              <circle cx="400" cy="89" r="17" fill="#7F90AB" /><text x="400" y="93" fill="#0B1220">I3</text>
              <circle cx="500" cy="89" r="17" fill="#7F90AB" /><text x="500" y="93" fill="#0B1220">I4</text>
              <rect x="548" y="64" width="46" height="50" rx="10" fill="#1E3A5F" /><text x="571" y="95" fontSize="20" fill="#E8EEF8">H</text>
              <text x="170" y="52" fill="#34D3A8">GREEN</text>
              <text x="285" y="52" fill="#F6B93B">PREPARING</text>
              <text x="400" y="52" fill="#A3B2CA">MONITOR</text>
              <text x="500" y="52" fill="#A3B2CA">MONITOR</text>
              <g fontFamily="'IBM Plex Mono', monospace" fontWeight="500" fill="#E8EEF8">
                <text x="170" y="132">ETA 12 s</text><text x="285" y="132">ETA 40 s</text><text x="400" y="132">ETA 85 s</text><text x="500" y="132">ETA 130 s</text>
              </g>
            </g>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#A3B2CA', lineHeight: 1.5 }}>
          <span>Muhammad Ahmad Asif · Muhammad Taimoor Nasir · Muhammad Usman Danial</span>
          <span>Advisor: Prof. Hafiz Ahsan Arshad · Co-advisor: Dr. Muhammad Husnain Ashfaq</span>
        </div>
      </div>

      {/* Right Column: Employee Authentication */}
      <div
        style={{
          flex: '1 1 460px',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '56px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {view === 'save-credentials' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Save your credentials?</h2>
                <span style={{ fontSize: '14px', color: '#A3B2CA' }}>
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
                <span style={{ fontSize: '14px', color: '#A3B2CA' }}>
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
                    <label htmlFor="account-type" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Account type</label>
                    <select id="account-type" className="field" value={accountRole} onChange={(event) => setAccountRole(event.target.value === 'admin' ? 'admin' : 'employee')}>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="department" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Department</label>
                    <select id="department" className="field" value={department} onChange={(event) => setDepartment(event.target.value === 'PSCA' ? 'PSCA' : '1122')}>
                      <option value="PSCA">PSCA</option>
                      <option value="1122">1122</option>
                    </select>
                  </div>
                  {view === 'signup' && accountRole === 'admin' && (
                    <span style={{ fontSize: '12px', color: '#F6B93B' }}>
                      Admin self-registration is enabled. Admin access should only be used by trusted personnel.
                    </span>
                  )}
                </>
              )}

              {view === 'signup' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="full-name" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Full name</label>
                    <input id="full-name" className="field" type="text" autoComplete="name" maxLength={120} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="job-title" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Job title</label>
                    <input id="job-title" className="field" type="text" autoComplete="organization-title" maxLength={120} required value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
                  </div>
                </>
              )}

              {['login', 'signup', 'forgot-password'].includes(view) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="official-email" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Official email address</label>
                  <input id="official-email" className="field" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              )}

              {view === 'login' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="login-password" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Password</label>
                    <input id="login-password" className="field" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                  </div>
                  <button type="button" className="btn-g" style={{ alignSelf: 'flex-end' }} onClick={() => { setView('forgot-password'); setError(''); setMessage(''); }}>
                    Forgot password?
                  </button>
                </>
              )}

              {view === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="signup-password" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Password</label>
                  <input id="signup-password" className="field" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
                  <span style={{ fontSize: '12px', color: '#7F90AB' }}>Use at least 8 characters.</span>
                </div>
              )}

              {(view === 'verify-signup' || view === 'verify-reset') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="otp-code" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Six-digit verification code</label>
                  <input id="otp-code" className="field" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} />
                </div>
              )}

              {view === 'reset-password' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="new-password" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>New password</label>
                    <input id="new-password" className="field" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="confirm-password" style={{ fontSize: '13px', fontWeight: 600, color: '#A3B2CA' }}>Confirm new password</label>
                    <input id="confirm-password" className="field" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                  </div>
                </>
              )}

              {message && <span role="status" style={{ color: '#34D3A8', fontSize: '13px' }}>{message}</span>}
              {error && <span role="alert" style={{ color: '#FF7A7A', fontSize: '13px' }}>{error}</span>}

              <button type="submit" className="btn-p" style={{ width: '100%' }} disabled={isWorking}>
                {isWorking ? 'Please wait...'
                  : view === 'login' ? 'Sign in'
                    : view === 'signup' ? 'Continue to email verification'
                      : view === 'verify-signup' ? 'Verify and create account'
                        : view === 'forgot-password' ? 'Send reset code'
                          : view === 'verify-reset' ? 'Verify code'
                            : 'Update password'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06231C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <span style={{ fontSize: '12px', color: '#7F90AB', lineHeight: 1.5 }}>
                Email codes are sent to your address. Passwords are hashed in the backend; browser storage remembers only your email if you choose.
              </span>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
