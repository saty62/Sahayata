'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Mail, User as UserIcon, Phone, FileText, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [pan, setPan] = useState('');
  const [city, setCity] = useState('Bhopal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile: mobile.trim() || undefined,
        pan: pan.trim() ? pan.trim().toUpperCase() : undefined,
        address: { city, state: 'Madhya Pradesh' },
      });

      if (res.success && res.data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sahayata_auth_token', res.data.token);
          localStorage.setItem('sahayata_user', JSON.stringify(res.data.user));
        }
        router.push('/donor');
      } else {
        setError(res.message || 'पंजीकरण विफल रहा।');
      }
    } catch (err: any) {
      setError(err.message || 'पंजीकरण में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-forest flex items-center justify-center text-white mx-auto shadow-soft-sm">
          <Heart className="w-7 h-7 fill-current text-accent" />
        </div>
        <h1 className="font-hindi text-2xl sm:text-3xl font-extrabold text-charcoal">
          दानदाता खाता बनाएं
        </h1>
        <p className="font-hindi text-xs sm:text-sm text-charcoal-muted">
          अपने समस्त दान और 80G प्रमाणपत्र एक ही स्थान पर प्रबंधित करें
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-hindi border border-red-200 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E5DD] shadow-soft-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
            पूरा नाम (Full Name) *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="उदा. सुनीता वर्मा"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
            ईमेल पता (Email Address) *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sunita@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-sm text-charcoal focus:ring-2 focus:ring-forest"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
            पासवर्ड (Password) *
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="न्यूनतम 6 अक्षर"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-sm text-charcoal focus:ring-2 focus:ring-forest"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
              मोबाइल नंबर
            </label>
            <input
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="10 अंक"
              className="w-full px-3 py-2 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-xs text-charcoal focus:ring-2 focus:ring-forest"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
              पैन नंबर (PAN)
            </label>
            <input
              type="text"
              maxLength={10}
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              className="w-full px-3 py-2 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-xs font-mono uppercase focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
            शहर (City)
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bhopal"
            className="w-full px-3.5 py-2 rounded-xl border border-[#E8E5DD] bg-[#FAF9F6] text-xs text-charcoal font-hindi focus:ring-2 focus:ring-forest"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover transition-colors shadow-soft-sm disabled:opacity-50"
          >
            {loading ? 'पंजीकरण हो रहा है...' : 'खाता बनाएं (Create Account)'}
          </button>
        </div>

        <div className="text-center text-xs text-charcoal-muted pt-2 border-t border-[#E8E5DD] font-hindi">
          <span>पहले से खाता है? </span>
          <Link href="/login" className="font-semibold text-forest hover:underline">
            लॉग इन करें (Sign In)
          </Link>
        </div>
      </form>
    </div>
  );
}
