'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Lock, Mail, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email: email.trim(), password });
      if (res.success && res.data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sahayata_auth_token', res.data.token);
          localStorage.setItem('sahayata_user', JSON.stringify(res.data.user));
        }

        if (res.data.user.role === 'ADMIN') {
          router.push(redirect === '/' ? '/admin' : redirect);
        } else {
          router.push(redirect === '/' ? '/donor' : redirect);
        }
      } else {
        setError(res.message || 'लॉग इन विफल रहा।');
      }
    } catch (err: any) {
      setError(err.message || 'अमान्य ईमेल अथवा पासवर्ड।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type: 'admin' | 'donor') => {
    if (type === 'admin') {
      setEmail('admin@sahayata.org.in');
      setPassword('Admin@1234');
    } else {
      setEmail('donor@sahayata.org.in');
      setPassword('Donor@1234');
    }
    setError('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      {/* Brand header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-forest flex items-center justify-center text-white mx-auto shadow-soft-sm">
          <Heart className="w-7 h-7 fill-current text-accent" />
        </div>
        <h1 className="font-hindi text-2xl sm:text-3xl font-extrabold text-charcoal">
          सहायता मंच में प्रवेश करें
        </h1>
        <p className="font-hindi text-xs sm:text-sm text-charcoal-muted">
          दानदाता खाता अथवा ट्रस्ट प्रशासनिक सीएमएस
        </p>
      </div>

      {/* Quick Demo Credentials Box */}
      <div className="bg-sage/40 p-4 rounded-2xl border border-sage-dark/40 space-y-2.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-forest font-hindi">
          <ShieldCheck className="w-4 h-4 text-forest" />
          <span>त्वरित डेमो लॉगिन (1-Click Demo Fill):</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickFill('admin')}
            className="px-3 py-2 rounded-xl bg-white border border-[#E8E5DD] hover:bg-forest hover:text-white text-xs font-semibold text-charcoal transition-colors font-hindi flex items-center justify-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>एडमिन (Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('donor')}
            className="px-3 py-2 rounded-xl bg-white border border-[#E8E5DD] hover:bg-forest hover:text-white text-xs font-semibold text-charcoal transition-colors font-hindi flex items-center justify-center space-x-1"
          >
            <UserCheck className="w-3.5 h-3.5 text-forest" />
            <span>दानदाता (Donor)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-hindi border border-red-200 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E5DD] shadow-soft-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
            ईमेल पता (Email) *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sahayata.org.in"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-sm text-charcoal focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
            पासवर्ड (Password) *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-sm text-charcoal focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover transition-colors shadow-soft-sm disabled:opacity-50"
        >
          {loading ? 'सत्यापित किया जा रहा है...' : 'लॉग इन करें (Sign In)'}
        </button>

        <div className="text-center text-xs text-charcoal-muted pt-2 border-t border-[#E8E5DD] font-hindi">
          <span>नया दानदाता खाता खोलना चाहते हैं? </span>
          <Link href="/register" className="font-semibold text-forest hover:underline">
            पंजीकरण करें (Register)
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 text-center font-hindi text-charcoal">लोड हो रहा है...</div>}>
      <LoginContent />
    </Suspense>
  );
}
