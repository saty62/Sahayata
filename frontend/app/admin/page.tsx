'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Heart,
  FileCheck2,
  Clock,
  BookOpen,
  FileDown,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Authenticate and load admin dashboard
    api.getAdminDashboard()
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || 'एडमिन डेटा लोड नहीं हो सका।');
        }
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          router.push('/login?redirect=/admin');
        } else {
          setError(err.message || 'एडमिन पोर्टल तक पहुंच अस्वीकृत।');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="h-8 bg-sage/40 rounded-full w-1/4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-white rounded-3xl border border-ivory-border animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-hindi text-xl font-bold text-charcoal">पहुंच अस्वीकृत (Access Denied)</h1>
        <p className="text-sm text-charcoal-muted font-hindi">{error}</p>
        <Link
          href="/login?redirect=/admin"
          className="inline-flex items-center px-6 py-2.5 rounded-xl bg-forest text-white text-xs font-bold touch-target"
        >
          एडमिन लॉगिन पर जाएं
        </Link>
      </main>
    );
  }

  const { summary, recentDonations, campaignPerformance } = data;

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-24">
      {/* Top Banner: Admin Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-ivory-border">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-950 font-bold text-xs border border-amber-300 font-hindi">
              प्रशासनिक कंसोल (Admin CMS)
            </span>
            <span className="text-xs text-charcoal-muted font-hindi">
              कंपनी ए चैरिटेबल ट्रस्ट (भोपाल, मध्य प्रदेश)
            </span>
          </div>
          <h1 className="heading-hindi text-2xl sm:text-3xl md:text-4xl font-extrabold text-charcoal">
            ट्रस्ट प्रबंधन डैशबोर्ड
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/schemes"
            className="inline-flex items-center px-5 py-3 rounded-2xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover shadow-soft-sm touch-target"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-accent" />
            <span>योजनाएं प्रबंधित करें (Manage Schemes)</span>
          </Link>

          <a
            href={api.getForm10BDExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-3 rounded-2xl border border-forest text-forest bg-white text-xs font-hindi font-bold hover:bg-sage/40 transition-colors shadow-soft-sm touch-target"
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            <span>फॉर्म 10BD CSV डाउनलोड</span>
          </a>
        </div>
      </div>

      {/* Demo metrics notification */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-950 font-hindi">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold">प्रदर्शनात्मक डेटा सूचना:</span> नीचे प्रदर्शित आंकड़े शैक्षणिक व तकनीकी मूल्यांकन के लिए तैयार किए गए प्रामाणिक नमूना डेटा (Realistic Seeded Data) पर आधारित हैं।
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Donations */}
        <div className="bg-white p-6 rounded-3xl border border-ivory-border shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-forest">
            <span className="text-xs font-bold font-hindi uppercase tracking-wider text-charcoal-muted">
              कुल दान राशि (Total Donated)
            </span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-forest font-sans">
            ₹{summary.totalCollectedAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-charcoal-muted font-hindi">
            {summary.totalTransactions} सफल भुगतान
          </p>
        </div>

        {/* Unique Donors */}
        <div className="bg-white p-6 rounded-3xl border border-ivory-border shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-forest">
            <span className="text-xs font-bold font-hindi uppercase tracking-wider text-charcoal-muted">
              कुल दानदाता (Total Donors)
            </span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-charcoal font-sans">
            {summary.totalDonors}
          </div>
          <p className="text-xs text-charcoal-muted font-hindi">
            विशिष्ट ईमेल दानदाता संख्या
          </p>
        </div>

        {/* Receipts & Certificates */}
        <div className="bg-white p-6 rounded-3xl border border-ivory-border shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-forest">
            <span className="text-xs font-bold font-hindi uppercase tracking-wider text-charcoal-muted">
              80G रसीदें (Receipts)
            </span>
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-charcoal font-sans">
            {summary.totalReceiptsGenerated}
          </div>
          <p className="text-xs text-charcoal-muted flex items-center font-hindi">
            {summary.pendingPdfJobs > 0 ? (
              <span className="text-amber-800 font-bold flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {summary.pendingPdfJobs} पीडीएफ प्रक्रियाधीन
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">सभी पीडीएफ तैयार हैं</span>
            )}
          </p>
        </div>

        {/* Schemes Status */}
        <div className="bg-white p-6 rounded-3xl border border-ivory-border shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-forest">
            <span className="text-xs font-bold font-hindi uppercase tracking-wider text-charcoal-muted">
              योजनाएं (Schemes)
            </span>
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-charcoal font-sans">
            {summary.publishedSchemes}
          </div>
          <p className="text-xs text-charcoal-muted font-hindi">
            {summary.pendingSchemeApprovals > 0 ? (
              <span className="text-amber-800 font-bold">
                {summary.pendingSchemeApprovals} AI ड्राफ्ट समीक्षाधीन
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">सभी योजनाएं प्रकाशित</span>
            )}
          </p>
        </div>
      </div>

      {/* Grid: Recent Donations & Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Donations (2 Cols) */}
        <section className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-ivory-border shadow-soft-sm space-y-6" aria-labelledby="donations-table-heading">
          <div className="flex items-center justify-between">
            <h2 id="donations-table-heading" className="font-hindi text-xl font-bold text-charcoal">
              हाल ही में प्राप्त दान (Recent Donations)
            </h2>
            <span className="text-xs text-charcoal-muted font-hindi">
              नवीनतम 8 प्रविष्टियां
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-charcoal font-bold border-b border-ivory-border font-hindi">
                <tr>
                  <th scope="col" className="py-3.5 px-3">दानदाता (Donor)</th>
                  <th scope="col" className="py-3.5 px-3">अभियान (Campaign)</th>
                  <th scope="col" className="py-3.5 px-3">राशि (Amount)</th>
                  <th scope="col" className="py-3.5 px-3">माध्यम (Mode)</th>
                  <th scope="col" className="py-3.5 px-3">स्थिति (Status)</th>
                  <th scope="col" className="py-3.5 px-3">दिनांक (Date)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-border">
                {recentDonations.map((d: any) => (
                  <tr key={d._id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-charcoal">{d.donorName}</div>
                      <div className="text-[11px] text-charcoal-muted truncate max-w-[140px]">{d.donorEmail}</div>
                    </td>
                    <td className="py-3.5 px-3 font-hindi text-charcoal font-medium max-w-xs truncate">
                      {d.campaignId?.nameHindi || d.campaignId?.name || 'सामान्य कोष'}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-forest font-sans">
                      ₹{d.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-charcoal-muted font-mono">
                      {d.paymentMode}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-hindi ${
                          d.paymentStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-50 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {d.paymentStatus === 'COMPLETED' ? 'सफल' : d.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-charcoal-muted font-hindi">
                      {new Date(d.createdAt).toLocaleDateString('hi-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {recentDonations.map((d: any) => (
              <div key={d._id} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-ivory-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-charcoal">{d.donorName}</span>
                  <span className="font-extrabold text-forest font-sans">₹{d.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-charcoal-muted font-hindi">
                  <span className="truncate max-w-[180px]">{d.campaignId?.nameHindi || 'सामान्य कोष'}</span>
                  <span>{new Date(d.createdAt).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Campaign Performance (1 Col) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-border shadow-soft-sm space-y-6" aria-labelledby="campaign-progress-heading">
          <div className="flex items-center justify-between">
            <h2 id="campaign-progress-heading" className="font-hindi text-xl font-bold text-charcoal">
              अभियान प्रगति (Campaigns)
            </h2>
            <span className="text-xs text-charcoal-muted font-hindi">
              {campaignPerformance.length} सक्रिय
            </span>
          </div>

          <div className="space-y-5">
            {campaignPerformance.map((c: any) => (
              <div key={c._id} className="space-y-2 border-b border-ivory-border pb-4 last:border-b-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-hindi font-bold text-charcoal line-clamp-1">
                    {c.nameHindi}
                  </span>
                  <span className="font-extrabold text-forest font-sans">{c.percentAchieved}%</span>
                </div>

                <div className="w-full bg-[#FAF9F6] h-2.5 rounded-full overflow-hidden border border-ivory-border">
                  <div
                    className="bg-forest h-full rounded-full"
                    style={{ width: `${c.percentAchieved}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-charcoal-muted font-hindi">
                  <span>एकत्रित: ₹{c.collectedAmount.toLocaleString('en-IN')}</span>
                  <span>लक्ष्य: ₹{c.targetAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/admin/schemes"
              className="w-full py-3.5 rounded-2xl border border-forest text-forest font-hindi font-bold text-xs flex items-center justify-center hover:bg-sage/40 transition-colors touch-target"
            >
              <span>योजना CMS संपादक पर जाएं</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
