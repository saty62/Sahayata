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
  AlertCircle,
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
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 bg-sage/40 rounded w-1/3 animate-pulse" />
        <div className="h-32 bg-white rounded-2xl border border-[#E8E5DD] animate-pulse" />
      </div>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E5DD]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-forest/10 text-forest text-xs font-semibold font-hindi">
              दानदाता पोर्टल (Donor Portal)
            </span>
          </div>
          <h1 className="font-hindi text-3xl font-extrabold text-charcoal mt-1">
            नमस्ते, {user.name} जी
          </h1>
          <p className="text-xs text-charcoal-muted font-hindi">
            आपकी दान यात्रा और 80G कर छूट प्रमाण पत्र रिकॉर्ड
          </p>
        </div>

        <Link
          href="/donate"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover shadow-soft-sm self-start sm:self-auto"
        >
          <Heart className="w-4 h-4 mr-1.5 text-accent fill-current" />
          <span>नया दान सहयोग करें (Donate Now)</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-hindi border border-red-200">
          {error}
        </div>
      )}

      {/* Profile & Contribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Donor Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E5DD] shadow-soft-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-sage flex items-center justify-center text-forest">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-charcoal text-base">{user.name}</h3>
              <p className="text-xs text-charcoal-muted font-mono">{user.pan || 'PAN: उपलब्ध नहीं'}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-charcoal-muted border-t border-[#E8E5DD] pt-3">
            <div className="flex items-center">
              <Mail className="w-3.5 h-3.5 mr-2 text-forest shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.mobile && (
              <div className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2 text-forest shrink-0" />
                <span>+91 {user.mobile}</span>
              </div>
            )}
            {user.address && (user.address.city || user.address.state) && (
              <div className="flex items-start">
                <MapPin className="w-3.5 h-3.5 mr-2 text-forest shrink-0 mt-0.5" />
                <span>
                  {user.address.street ? `${user.address.street}, ` : ''}
                  {user.address.city || 'Bhopal'}, {user.address.state || 'Madhya Pradesh'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total Contributed Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E5DD] shadow-soft-sm space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted font-hindi">
              कुल सहयोग राशि (Total Donated)
            </span>
            <div className="text-3xl font-extrabold text-forest">
              ₹{totalDonated.toLocaleString('en-IN')}.00
            </div>
            <p className="text-xs text-charcoal-muted font-hindi">
              {completedCount} पूर्ण दान योगदान
            </p>
          </div>

          <div className="bg-sage/40 p-3 rounded-xl border border-sage-dark/30 flex items-center space-x-2 text-xs text-forest font-hindi">
            <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
            <span>धारा 80G के तहत 50% कर लाभ योग्य</span>
          </div>
        </div>

        {/* 80G Compliance Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E5DD] shadow-soft-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted font-hindi">
              80G कर प्रमाणन स्थिति
            </span>
            <div className="text-sm font-bold text-charcoal flex items-center space-x-1.5 pt-1">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>सभी प्रमाणपत्र उपलब्ध</span>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed font-hindi pt-1">
              आप नीचे दी गई सूची से किसी भी पूर्व दान की रसीद अथवा 80G प्रमाणपत्र सीधे डाउनलोड कर सकते हैं।
            </p>
          </div>

          <div className="text-[11px] text-charcoal-light font-mono">
            Trust 80G: CIT(E)/BPL/80G/2023-24/A-1089
          </div>
        </div>
      </div>

      {/* DONATION HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] shadow-soft-sm overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DD]">
          <h2 className="font-hindi text-xl font-bold text-charcoal">
            दान इतिहास एवं प्रमाणपत्र (Donation History)
          </h2>
          <span className="text-xs text-charcoal-muted font-hindi">
            {donations.length} प्रविष्टियां
          </span>
        </div>

        {donations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-charcoal font-semibold border-b border-[#E8E5DD]">
                <tr>
                  <th className="py-3 px-4">अभियान (Campaign)</th>
                  <th className="py-3 px-4">राशि (Amount)</th>
                  <th className="py-3 px-4">दिनांक (Date)</th>
                  <th className="py-3 px-4">रसीद संख्या (Receipt No.)</th>
                  <th className="py-3 px-4">स्थिति (Status)</th>
                  <th className="py-3 px-4 text-right">प्रमाणपत्र (Downloads)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DD]">
                {donations.map((d: any) => {
                  const receipt = d.receipt;
                  const campaignName = d.campaignId?.nameHindi || d.campaignId?.name || 'सामान्य कोष';

                  return (
                    <tr key={d._id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                      <td className="py-3.5 px-4 font-hindi font-bold text-charcoal max-w-xs truncate">
                        {campaignName}
                        {d.donationType === 'MONTHLY_SIMULATED' && (
                          <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                            मासिक (Simulated)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-forest text-sm">
                        ₹{d.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-muted">
                        {new Date(d.createdAt).toLocaleDateString('hi-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-charcoal">
                        {receipt?.receiptNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            d.paymentStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {d.paymentStatus === 'COMPLETED' ? 'सफल' : 'विफल'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {receipt ? (
                          <>
                            <a
                              href={api.getReceiptDownloadUrl(receipt._id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-forest text-forest hover:bg-sage/40 font-hindi font-semibold text-[11px] transition-colors"
                              title="दान रसीद डाउनलोड"
                            >
                              <FileDown className="w-3.5 h-3.5 mr-1" />
                              <span>रसीद</span>
                            </a>
                            <a
                              href={api.getCertificateDownloadUrl(receipt._id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-forest text-white hover:bg-forest-hover font-hindi font-semibold text-[11px] transition-colors"
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
        ) : (
          <div className="text-center py-12 space-y-3">
            <Heart className="w-10 h-10 text-sage-dark mx-auto" />
            <p className="font-hindi text-base font-semibold text-charcoal">
              आपने अभी तक कोई दान नहीं किया है।
            </p>
            <p className="font-hindi text-xs text-charcoal-muted">
              मध्य प्रदेश की महिलाओं के कल्याण हेतु पहला कदम उठाएं।
            </p>
            <Link
              href="/donate"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-forest text-white text-xs font-hindi font-semibold"
            >
              सहयोग करें (Donate)
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
