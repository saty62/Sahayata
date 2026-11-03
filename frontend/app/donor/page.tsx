'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Heart,
  FileCheck2,
  Calendar,
  FileDown,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { User, Donation } from '@/types';

export default function DonorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDonorData = async () => {
      try {
        const [meRes, donationsRes] = await Promise.all([
          api.getMe(),
          api.getMyDonations(),
        ]);

        if (meRes.success && meRes.data?.user) {
          setUser(meRes.data.user);
        } else {
          router.push('/login?redirect=/donor');
          return;
        }

        if (donationsRes.success) {
          setDonations(donationsRes.data?.donations || []);
        }
      } catch (err: any) {
        if (err.status === 401 || err.status === 403) {
          router.push('/login?redirect=/donor');
        } else {
          setError(err.message || 'डैशबोर्ड लोड करने में विफल।');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDonorData();
  }, [router]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 bg-sage/40 rounded-full w-1/3 animate-pulse" />
        <div className="h-44 bg-white rounded-3xl border border-ivory-border animate-pulse" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate totals
  const totalDonated = donations
    .filter((d) => d.paymentStatus === 'COMPLETED')
    .reduce((sum, d) => sum + d.amount, 0);

  const completedCount = donations.filter((d) => d.paymentStatus === 'COMPLETED').length;

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-24">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-bold font-hindi">
              दानदाता व्यक्तिगत पोर्टल (Donor Dashboard)
            </span>
          </div>
          <h1 className="heading-hindi text-2xl sm:text-3xl md:text-4xl font-extrabold text-charcoal mt-1.5">
            नमस्ते, {user.name} जी
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted font-hindi mt-0.5">
            आपकी दान यात्रा, रसीदें और 80G कर छूट प्रमाण पत्र रिकॉर्ड
          </p>
        </div>

        <Link
          href="/donate"
          className="inline-flex items-center px-5 py-3 rounded-2xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover shadow-soft-sm self-start sm:self-auto touch-target"
        >
          <Heart className="w-4 h-4 mr-1.5 text-accent fill-current" />
          <span>नया दान सहयोग करें (Donate Now)</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-hindi border border-red-200" role="alert">
          {error}
        </div>
      )}

      {/* Profile & Contribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Donor Profile Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-ivory-border shadow-soft-sm space-y-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sage/60 flex items-center justify-center text-forest border border-sage-dark/40 shadow-soft-sm">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-charcoal text-base">{user.name}</h2>
              <p className="text-xs text-forest font-mono font-bold">{user.pan ? `PAN: ${user.pan}` : 'PAN: उपलब्ध नहीं'}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-charcoal-muted border-t border-ivory-border pt-3">
            <div className="flex items-center">
              <Mail className="w-3.5 h-3.5 mr-2 text-forest shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.mobile && (
              <div className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2 text-forest shrink-0" />
                <span className="font-mono">+91 {user.mobile}</span>
              </div>
            )}
            {user.address && (user.address.city || user.address.state) && (
              <div className="flex items-start">
                <MapPin className="w-3.5 h-3.5 mr-2 text-forest shrink-0 mt-0.5" />
                <span className="font-hindi">
                  {user.address.street ? `${user.address.street}, ` : ''}
                  {user.address.city || 'Bhopal'}, {user.address.state || 'Madhya Pradesh'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total Contributed Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-ivory-border shadow-soft-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted font-hindi">
              कुल सहयोग राशि (Total Donated)
            </span>
            <div className="text-3xl font-extrabold text-forest font-sans">
              ₹{totalDonated.toLocaleString('en-IN')}.00
            </div>
            <p className="text-xs text-charcoal-muted font-hindi">
              {completedCount} सफल दान योगदान
            </p>
          </div>

          <div className="bg-sage/40 p-3 rounded-2xl border border-sage-dark/30 flex items-center space-x-2 text-xs text-forest font-hindi">
            <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
            <span>धारा 80G के तहत 50% कर लाभ योग्य</span>
          </div>
        </div>

        {/* 80G Compliance Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-ivory-border shadow-soft-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted font-hindi">
              80G कर प्रमाणन स्थिति
            </span>
            <div className="text-sm font-bold text-charcoal flex items-center space-x-1.5 pt-0.5 font-hindi">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
              <span>सभी प्रमाणपत्र डाउनलोड हेतु उपलब्ध</span>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed font-hindi">
              नीचे दी गई सूची से किसी भी पूर्व दान की रसीद अथवा 80G प्रमाणपत्र सीधे डाउनलोड कर सकते हैं।
            </p>
          </div>

          <div className="text-[11px] text-charcoal-muted font-mono bg-[#FAF9F6] p-2 rounded-xl border border-ivory-border">
            Trust 80G: CIT(E)/BPL/80G/2023-24/A-1089
          </div>
        </div>
      </div>

      {/* DONATION HISTORY SECTION */}
      <section className="bg-white rounded-3xl border border-ivory-border shadow-soft-sm overflow-hidden space-y-4 p-6 sm:p-8" aria-labelledby="history-heading">
        <div className="flex items-center justify-between pb-4 border-b border-ivory-border">
          <h2 id="history-heading" className="font-hindi text-xl font-bold text-charcoal">
            दान इतिहास एवं प्रमाणपत्र (Donation History)
          </h2>
          <span className="text-xs text-charcoal-muted font-hindi">
            {donations.length} प्रविष्टियां
          </span>
        </div>

        {donations.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-charcoal font-bold border-b border-ivory-border font-hindi">
                  <tr>
                    <th scope="col" className="py-3.5 px-4">अभियान (Campaign)</th>
                    <th scope="col" className="py-3.5 px-4">राशि (Amount)</th>
                    <th scope="col" className="py-3.5 px-4">दिनांक (Date)</th>
                    <th scope="col" className="py-3.5 px-4">रसीद संख्या (Receipt No.)</th>
                    <th scope="col" className="py-3.5 px-4">स्थिति (Status)</th>
                    <th scope="col" className="py-3.5 px-4 text-right">प्रमाणपत्र (Downloads)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-border">
                  {donations.map((d: any) => {
                    const receipt = d.receipt;
                    const campaignName = d.campaignId?.nameHindi || d.campaignId?.name || 'सामान्य कोष';

                    return (
                      <tr key={d._id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                        <td className="py-4 px-4 font-hindi font-bold text-charcoal max-w-xs truncate">
                          {campaignName}
                          {d.donationType === 'MONTHLY_SIMULATED' && (
                            <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-300 font-hindi">
                              मासिक (Simulated)
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-forest text-sm font-sans">
                          ₹{d.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 text-charcoal-muted font-hindi">
                          {new Date(d.createdAt).toLocaleDateString('hi-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-charcoal">
                          {receipt?.receiptNumber ? (
                            <span className="bg-sage/50 px-2 py-0.5 rounded border border-sage-dark/30">
                              {receipt.receiptNumber}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold font-hindi ${
                              d.paymentStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                                : 'bg-red-50 text-red-900 border border-red-300'
                            }`}
                          >
                            {d.paymentStatus === 'COMPLETED' ? 'सफल' : 'विफल'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          {receipt ? (
                            <>
                              <a
                                href={api.getReceiptDownloadUrl(receipt._id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-forest text-forest hover:bg-sage/40 font-hindi font-bold text-xs transition-colors"
                                title="दान रसीद डाउनलोड"
                              >
                                <FileDown className="w-3.5 h-3.5 mr-1" />
                                <span>रसीद</span>
                              </a>
                              <a
                                href={api.getCertificateDownloadUrl(receipt._id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-forest text-white hover:bg-forest-hover font-hindi font-bold text-xs transition-colors shadow-soft-sm"
                                title="80G कर छूट प्रमाण पत्र डाउनलोड"
                              >
                                <FileDown className="w-3.5 h-3.5 mr-1 text-accent" />
                                <span>80G पत्र</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-charcoal-light font-hindi">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3">
              {donations.map((d: any) => {
                const receipt = d.receipt;
                const campaignName = d.campaignId?.nameHindi || d.campaignId?.name || 'सामान्य कोष';

                return (
                  <div key={d._id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-ivory-border space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-hindi font-bold text-sm text-charcoal">{campaignName}</h3>
                        <p className="text-[11px] text-charcoal-muted">
                          {new Date(d.createdAt).toLocaleDateString('hi-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="text-base font-extrabold text-forest font-sans">
                        ₹{d.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-ivory-border">
                      <span className="font-mono text-charcoal-muted text-[11px]">
                        {receipt?.receiptNumber || 'रसीद प्रक्रियाधीन'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-hindi ${
                          d.paymentStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                            : 'bg-red-50 text-red-900'
                        }`}
                      >
                        {d.paymentStatus === 'COMPLETED' ? 'सफल' : 'विफल'}
                      </span>
                    </div>

                    {receipt && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={api.getReceiptDownloadUrl(receipt._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl border border-forest text-forest hover:bg-sage/40 font-hindi font-bold text-xs text-center flex items-center justify-center space-x-1 touch-target"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>रसीद PDF</span>
                        </a>
                        <a
                          href={api.getCertificateDownloadUrl(receipt._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-forest text-white hover:bg-forest-hover font-hindi font-bold text-xs text-center flex items-center justify-center space-x-1 shadow-soft-sm touch-target"
                        >
                          <FileDown className="w-3.5 h-3.5 text-accent" />
                          <span>80G PDF</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Heart className="w-10 h-10 text-sage-dark mx-auto" />
            <p className="font-hindi text-base font-bold text-charcoal">
              आपने अभी तक कोई दान नहीं किया है।
            </p>
            <p className="font-hindi text-xs text-charcoal-muted">
              मध्य प्रदेश की महिलाओं के कल्याण हेतु पहला कदम उठाएं।
            </p>
            <Link
              href="/donate"
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-forest text-white text-xs font-hindi font-bold touch-target shadow-soft-sm"
            >
              सहयोग करें (Donate)
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
