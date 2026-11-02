'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Search, ShieldCheck, User as UserIcon, LogOut, Menu, X, Sparkles } from 'lucide-react';
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
      // logout fallback
      setCurrentUser(null);
      router.push('/');
    }
  };

  const navLinks = [
    { href: '/', labelHindi: 'योजनाएं', labelEnglish: 'Schemes' },
    { href: '/eligibility', labelHindi: 'पात्रता खोजें', labelEnglish: 'Find Eligibility', highlight: true },
    { href: '/#campaigns', labelHindi: 'दान अभियान', labelEnglish: 'Campaigns' },
    { href: '/#about', labelHindi: 'ट्रस्ट के बारे में', labelEnglish: 'About Trust' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E5DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Trust Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-forest flex items-center justify-center text-white shadow-soft-sm group-hover:bg-forest-dark transition-colors">
              <Heart className="w-6 h-6 fill-current text-accent" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-hindi font-bold text-2xl text-forest tracking-tight">सहायता</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sage text-forest font-medium border border-sage-dark/40">
                  मध्य प्रदेश
                </span>
              </div>
              <p className="text-xs text-charcoal-muted font-hindi">महिला कल्याण एवं सहयोग मंच</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-sage text-forest font-semibold'
                      : link.highlight
                      ? 'text-forest bg-sage/50 hover:bg-sage border border-sage-dark/30 font-semibold'
                      : 'text-charcoal hover:text-forest hover:bg-sage/30'
                  }`}
                >
                  {link.highlight && <Sparkles className="w-4 h-4 text-accent fill-current" />}
                  <span className="font-hindi">{link.labelHindi}</span>
                  <span className="text-xs text-charcoal-light font-normal hidden lg:inline">({link.labelEnglish})</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/donate"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest-hover shadow-soft-sm transition-all"
            >
              <Heart className="w-4 h-4 mr-2 text-accent" />
              <span>सहयोग करें (Donate)</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center space-x-2 border-l border-[#E8E5DD] pl-3">
                {currentUser.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-3 py-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1 text-amber-700" />
                    <span>एडमिन CMS</span>
                  </Link>
                ) : (
                  <Link
                    href="/donor"
                    className="inline-flex items-center px-3 py-2 rounded-lg bg-sage/60 text-forest text-xs font-semibold hover:bg-sage"
                  >
                    <UserIcon className="w-4 h-4 mr-1" />
                    <span>दान खाता ({currentUser.name.split(' ')[0]})</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  title="लॉगआउट करें (Logout)"
                  className="p-2 text-charcoal-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-3.5 py-2 rounded-lg border border-forest/30 text-forest text-sm font-medium hover:bg-sage/40 transition-colors"
              >
                <UserIcon className="w-4 h-4 mr-1.5" />
                <span>लॉग इन</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/donate"
              className="px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-medium"
            >
              सहयोग करें
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-charcoal hover:bg-sage/40 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E5DD] bg-[#FAF9F6] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-charcoal hover:bg-sage/40 font-hindi"
            >
              {link.labelHindi} ({link.labelEnglish})
            </Link>
          ))}

          <div className="pt-3 border-t border-[#E8E5DD] flex flex-col space-y-2">
            {currentUser ? (
              <>
                <Link
                  href={currentUser.role === 'ADMIN' ? '/admin' : '/donor'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg bg-sage text-forest font-semibold text-sm flex items-center"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span>{currentUser.name} ({currentUser.role === 'ADMIN' ? 'एडमिन' : 'दानदाता'})</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-2 rounded-lg text-red-700 text-sm font-medium text-left flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>लॉगआउट करें (Logout)</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg border border-forest text-forest font-semibold text-center text-sm"
              >
                लॉग इन / खाता बनाएं
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
