import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Lock
} from 'lucide-react';
import { auth, googleProvider, generateUserId, formatPhoneNumber } from '../services/firebase';
import { signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('phone'); // 'phone' or 'google'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Optional display name
  const [nameInput, setNameInput] = useState('');

  const otpInputsRef = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (!isOpen) return null;

  // Handle OTP input typing
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    // Auto advance focus
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Turn Firebase error codes into simple messages
  const friendlyError = (err) => {
    const code = err?.code || '';
    const map = {
      'auth/invalid-phone-number': 'That phone number is not valid. Please check it.',
      'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
      'auth/quota-exceeded': 'SMS limit reached for today. Please try again later.',
      'auth/invalid-verification-code': 'Incorrect OTP. Please check the SMS and try again.',
      'auth/code-expired': 'This OTP has expired. Please request a new one.',
      'auth/captcha-check-failed': 'Security check failed. Please refresh the page and try again.',
      'auth/unauthorized-domain': 'This website address is not allowed in Firebase yet (add it under Authentication → Settings → Authorized domains).',
      'auth/operation-not-allowed': 'This login method is not turned on in Firebase yet.',
      'auth/billing-not-enabled': 'SMS login needs billing enabled on the Firebase project.',
      'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
      'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow pop-ups and try again.',
      'auth/network-request-failed': 'Network problem. Please check your internet and try again.',
    };
    return map[code] || err?.message || 'Something went wrong. Please try again.';
  };

  const resetRecaptcha = () => {
    try { window.recaptchaVerifier?.clear(); } catch (e) { /* ignore */ }
    window.recaptchaVerifier = null;
  };

  // 1. Phone OTP: Firebase sends a real, new 6-digit SMS code every time
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!auth) {
      setError('Login service is not available. Please refresh the page.');
      return;
    }

    setLoading(true);
    const fullPhone = formatPhoneNumber(cleanNumber, countryCode);

    try {
      resetRecaptcha();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtp(['', '', '', '', '', '']);
      setIsOtpSent(true);
      setTimer(30);
    } catch (err) {
      console.error('Send OTP error:', err);
      resetRecaptcha();
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Phone OTP: check the code the user typed with Firebase
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    if (!confirmationResult) {
      setError('Please request a new OTP first.');
      return;
    }

    setLoading(true);
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const fullPhone = formatPhoneNumber(cleanNumber, countryCode);

    try {
      const result = await confirmationResult.confirm(enteredOtp);
      onLoginSuccess({
        id: result.user.uid,
        name: nameInput.trim() || `User (${cleanNumber.slice(-4)})`,
        email: result.user.email || '',
        phone: result.user.phoneNumber || fullPhone,
        photo_url: '',
        auth_provider: 'phone'
      });
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Google Sign-In (Google itself verifies the account)
  const handleGoogleSignIn = async () => {
    setError('');
    if (!auth || !googleProvider) {
      setError('Login service is not available. Please refresh the page.');
      return;
    }
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      onLoginSuccess({
        id: res.user.uid,
        name: res.user.displayName || 'Google User',
        email: res.user.email || '',
        phone: res.user.phoneNumber || '',
        photo_url: res.user.photoURL || '',
        auth_provider: 'google'
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div id="recaptcha-container"></div>
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-6 py-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X size={18} />
          </button>
          
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md mb-2 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Login to My Purchases</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Access your private purchases, bills & GST analytics
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => { setActiveTab('phone'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'phone'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Phone size={16} />
            Phone (OTP)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('google'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'google'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail size={16} />
            Google / Gmail
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: PHONE NUMBER WITH OTP */}
          {activeTab === 'phone' && (
            <div>
              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all shadow-sm">
                      <span className="inline-flex items-center px-3.5 bg-slate-100 text-slate-700 font-medium text-sm border-r border-slate-200">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        maxLength="10"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="flex-1 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Name / Business Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Yash Hardware"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phoneNumber.length < 10}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    ) : (
                      <>
                        <span>Get 6-Digit OTP</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">
                      Enter 6-digit OTP sent to <span className="font-semibold text-slate-800">+91 {phoneNumber}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setIsOtpSent(false); setOtp(['','','','','','']); }}
                      className="text-xs text-indigo-600 hover:underline mt-0.5 inline-block"
                    >
                      Change number
                    </button>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-none transition-all"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    {timer > 0 ? (
                      <span className="text-xs text-slate-400">
                        Resend code in {timer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE / GMAIL SIGN-IN */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Encrypted cloud storage with isolated user purchases</span>
          </p>
        </div>
      </div>
    </div>
  );
}
