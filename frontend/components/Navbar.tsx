'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Heart,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  PhoneCall,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { User } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check current session
    api.getMe()
      .then((res) => {
        if (res.success && res.data?.user) {
          setCurrentUser(res.data.user);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.logout();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sahayata_auth_token');
        localStorage.removeItem('sahayata_user');
      }
      setCurrentUser(null);
      router.push('/');
    } catch (e) {
      setCurrentUser(null);
      router.push('/');
    }
  };

  const navLinks = [
    { href: '/', labelHindi: 'सरकारी योजनाएं', labelEnglish: 'Schemes' },
    { href: '/eligibility', labelHindi: 'पात्रता खोजें', labelEnglish: 'Eligibility Finder', highlight: true },
    { href: '/#campaigns', labelHindi: 'सहयोग अभियान', labelEnglish: 'Campaigns' },
    { href: '/#about', labelHindi: 'ट्रस्ट परिचय', labelEnglish: 'About Us' },
  ];

  return (
    <>
      {/* WCAG Skip to Main Content Link */}
      <a href="#main-content" className="skip-link">
        सीधे मुख्य सामग्री पर जाएं (Skip to main content)
      </a>

      {/* Top Official & Trust Verification Ribbon */}
      <div className="bg-forest text-ivory text-xs border-b border-forest-light relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-charcoal font-bold text-[10px] tracking-wide uppercase">
              कंपनी ए ट्रस्ट
            </span>
            <span className="font-hindi text-[11px] sm:text-xs text-sage-light flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-accent inline shrink-0" />
              मध्य प्रदेश के 9 जिलों में कार्यरत पंजीकृत चैरिटेबल ट्रस्ट (80G/12A)
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-4 text-[11px] text-sage-light">
            <a
              href="tel:18002334567"
              className="flex items-center space-x-1 hover:text-accent transition-colors font-hindi"
              aria-label="Call Free Helpline 1800-233-4567"
            >
              <PhoneCall className="w-3 h-3 text-accent" />
              <span>निःशुल्क हेल्पलाइन: <strong>1800-233-4567</strong></span>
            </a>
            <span className="text-sage/40">•</span>
            <span className="flex items-center text-emerald-300 font-hindi">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              शासन सत्यापित प्रारूप
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-ivory-border shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand Identity */}
            <Link
              href="/"
              className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-forest rounded-xl p-1"
              aria-label="Sahayata Homepage"
            >
              <div className="w-12 h-12 rounded-2xl bg-forest flex items-center justify-center text-white shadow-soft-sm group-hover:bg-forest-dark transition-all border border-forest-light/30">
                <Heart className="w-6 h-6 fill-current text-accent" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-hindi font-extrabold text-2xl sm:text-3xl text-forest tracking-tight">
                    सहायता
                  </span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-sage text-forest font-semibold border border-sage-dark/40 font-hindi">
                    म.प्र.
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-charcoal-muted font-hindi leading-tight">
                  महिला कल्याण एवं पारदर्शी सहयोग मंच
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="मुख्य नेविगेशन">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2.5 rounded-xl text-sm font-hindi transition-all flex items-center space-x-1.5 touch-target ${
                      isActive
                        ? 'bg-sage text-forest font-bold shadow-soft-sm'
                        : link.highlight
                        ? 'text-forest bg-sage/60 hover:bg-sage border border-sage-dark/40 font-bold'
                        : 'text-charcoal hover:text-forest hover:bg-sage/40 font-medium'
                    }`}
                  >
                    {link.highlight && <Sparkles className="w-4 h-4 text-accent fill-current shrink-0" />}
                    <span>{link.labelHindi}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Action Buttons & Profile Controls */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/donate"
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-hindi font-bold hover:bg-forest-hover shadow-soft-sm transition-all border border-forest-light"
              >
                <Heart className="w-4 h-4 mr-2 text-accent fill-current" />
                <span>दान करें (Donate)</span>
              </Link>

              {currentUser ? (
                <div className="flex items-center space-x-2 border-l border-ivory-border pl-3">
                  {currentUser.role === 'ADMIN' ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-50 text-amber-950 border border-amber-300 text-xs font-bold hover:bg-amber-100 font-hindi shadow-soft-sm"
                    >
                      <ShieldCheck className="w-4 h-4 mr-1 text-amber-800" />
                      <span>प्रशासनिक CMS</span>
                    </Link>
                  ) : (
                    <Link
                      href="/donor"
                      className="inline-flex items-center px-3.5 py-2 rounded-xl bg-sage/70 text-forest text-xs font-bold hover:bg-sage font-hindi shadow-soft-sm"
                    >
                      <UserIcon className="w-4 h-4 mr-1.5" />
                      <span>{currentUser.name.split(' ')[0]} का खाता</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    title="लॉगआउट करें (Logout)"
                    aria-label="Logout"
                    className="p-2 text-charcoal-muted hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors touch-target"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center px-3.5 py-2.5 rounded-xl border border-forest/30 text-forest text-xs font-bold hover:bg-sage/40 transition-colors font-hindi"
                >
                  <UserIcon className="w-4 h-4 mr-1.5" />
                  <span>प्रवेश / लॉगिन</span>
                </Link>
              )}
            </div>

            {/* Mobile Header Quick Actions */}
            <div className="flex md:hidden items-center space-x-2">
              <Link
                href="/donate"
                className="px-3 py-2 rounded-xl bg-forest text-white text-xs font-hindi font-bold flex items-center space-x-1"
              >
                <Heart className="w-3.5 h-3.5 text-accent fill-current" />
                <span>सहयोग</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl text-charcoal hover:bg-sage/50 focus:outline-none touch-target"
                aria-label={mobileMenuOpen ? 'मेनू बंद करें' : 'मेनू खोलें'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-ivory-border bg-ivory px-4 pt-3 pb-8 space-y-3 shadow-soft-md animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-hindi font-medium transition-colors ${
                      isActive ? 'bg-sage text-forest font-bold' : 'text-charcoal hover:bg-sage/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        {link.highlight && <Sparkles className="w-4 h-4 text-accent fill-current mr-2 shrink-0" />}
                        {link.labelHindi}
                      </span>
                      <span className="text-xs text-charcoal-muted">({link.labelEnglish})</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick helpline dial button for mobile */}
            <div className="p-3 rounded-2xl bg-sage/50 border border-sage-dark/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-forest font-hindi">सहायता महिला हेल्पलाइन</p>
                <p className="text-[11px] text-charcoal-muted">निःशुल्क परामर्श व मार्गदर्शन</p>
              </div>
              <a
                href="tel:18002334567"
                className="px-3 py-2 rounded-xl bg-forest text-white text-xs font-bold flex items-center space-x-1"
              >
                <PhoneCall className="w-3.5 h-3.5 text-accent" />
                <span>1800-233-4567</span>
              </a>
            </div>

            <div className="pt-2 border-t border-ivory-border flex flex-col space-y-2">
              {currentUser ? (
                <>
                  <Link
                    href={currentUser.role === 'ADMIN' ? '/admin' : '/donor'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl bg-forest text-white font-bold text-sm flex items-center justify-between font-hindi shadow-soft-sm"
                  >
                    <span className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-accent" />
                      {currentUser.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-forest-dark text-sage-light">
                      {currentUser.role === 'ADMIN' ? 'एडमिन' : 'दानदाता'}
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="px-4 py-2.5 rounded-xl text-red-700 text-sm font-hindi font-medium text-left flex items-center hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>लॉगआउट करें (Logout)</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl border border-forest text-forest font-hindi font-bold text-center text-sm hover:bg-sage/30"
                >
                  लॉग इन / दानदाता खाता
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
