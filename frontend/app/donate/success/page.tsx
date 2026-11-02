'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  FileDown,
  Clock,
  RotateCcw,
  ShieldCheck,
  Heart,
  Share2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';
import { Donation, Receipt } from '@/types';

function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams?.get('id');

  const [donation, setDonation] = useState<Donation | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfStatus, setPdfStatus] = useState<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('PENDING');

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#245C46', '#E9AD65', '#DCE9DF'],
      });
    } catch (e) {
      // non-critical
    }
  }, []);

  // Poll for receipt & PDF generation status
  useEffect(() => {
    if (!donationId) return;

    let pollInterval: any;

    const fetchStatus = async () => {
      try {
        const res = await api.getDonationById(donationId);
        if (res.success && res.data?.donation) {
          setDonation(res.data.donation);
          if (res.data.receipt) {
            setReceipt(res.data.receipt);
            setPdfStatus(res.data.receipt.generationStatus);

            if (res.data.receipt.generationStatus === 'COMPLETED') {
              clearInterval(pollInterval);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching donation receipt status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    pollInterval = setInterval(fetchStatus, 2500);

    return () => clearInterval(pollInterval);
  }, [donationId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-sage/50 animate-pulse mx-auto" />
        <h2 className="font-hindi text-xl font-bold text-charcoal">
          रसीद तैयार की जा रही है...
        </h2>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-hindi text-xl font-bold text-charcoal">
          दान रिकॉर्ड नहीं मिला
        </h2>
        <Link href="/" className="px-4 py-2 rounded-xl bg-forest text-white text-xs font-hindi">
          मुख्य पृष्ठ पर वापस जाएं
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Confirmation Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E5DD] shadow-soft-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-soft-sm">
          <CheckCircle className="w-12 h-12" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-forest font-hindi">
            भुगतान सफल (Payment Confirmed)
          </span>
          <h1 className="font-hindi text-3xl sm:text-4xl font-extrabold text-charcoal">
            आपके अमूल्य सहयोग के लिए हार्दिक धन्यवाद!
          </h1>
          <p className="font-hindi text-sm text-charcoal-muted max-w-lg mx-auto leading-relaxed pt-1">
            श्री/श्रीमती <span className="font-bold text-charcoal">{donation.donorName}</span>, कंपनी ए चैरिटेबल ट्रस्ट आपके इस योगदान की सराहना करता है।
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E8E5DD] max-w-md mx-auto space-y-3 text-left">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E8E5DD]">
            <span className="text-charcoal-muted font-hindi">दान राशि:</span>
            <span className="font-bold text-forest text-base">₹{donation.amount.toLocaleString('en-IN')}.00</span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E8E5DD]">
            <span className="text-charcoal-muted font-hindi">अनुक्रमित रसीद संख्या:</span>
            <span className="font-mono font-bold text-charcoal text-xs">
              {receipt?.receiptNumber || 'आवंटित की जा रही है...'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E8E5DD]">
            <span className="text-charcoal-muted font-hindi">80G प्रमाण पत्र संख्या:</span>
            <span className="font-mono font-bold text-charcoal text-xs">
              {receipt?.certificateNumber || 'प्रक्रियाधीन...'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-charcoal-muted font-hindi">भुगतान संदर्भ (Ref):</span>
            <span className="font-mono text-charcoal-muted text-[11px]">
              {donation.transactionReference}
            </span>
          </div>
        </div>

        {/* PDF GENERATION STATUS & DOWNLOADS */}
        <div className="pt-4 border-t border-[#E8E5DD] space-y-4">
          <div className="flex items-center justify-center space-x-2">
            {pdfStatus === 'COMPLETED' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 font-hindi">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                <span>पीडीएफ दस्तावेज़ तैयार हैं (PDF Documents Ready)</span>
              </span>
            ) : pdfStatus === 'FAILED' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 font-hindi">
                <span>पीडीएफ निर्माण में विलंब - स्वतः पुनः प्रयास जारी</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 font-hindi animate-pulse">
                <Clock className="w-3.5 h-3.5 mr-1" />
                <span>बैकग्राउंड वर्कर द्वारा पीडीएफ तैयार की जा रही है...</span>
              </span>
            )}
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a
              href={receipt ? api.getReceiptDownloadUrl(receipt._id) : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-3.5 px-4 rounded-xl font-hindi font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-soft-sm ${
                pdfStatus === 'COMPLETED'
                  ? 'bg-forest text-white hover:bg-forest-hover cursor-pointer'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed pointer-events-none'
              }`}
            >
              <FileDown className="w-4 h-4 text-accent" />
              <span>दान रसीद डाउनलोड करें (Receipt PDF)</span>
            </a>

            <a
              href={receipt ? api.getCertificateDownloadUrl(receipt._id) : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-3.5 px-4 rounded-xl font-hindi font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-soft-sm ${
                pdfStatus === 'COMPLETED'
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed pointer-events-none'
              }`}
            >
              <FileDown className="w-4 h-4 text-accent" />
              <span>80G कर छूट प्रमाण पत्र (80G Tax PDF)</span>
            </a>
          </div>
        </div>

        {/* Demo Fictional Disclosures */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-left flex items-start space-x-3 text-xs text-amber-900 font-hindi">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">प्रदर्शनात्मक नमूना सूचना:</span> यह रसीद एवं 80G प्रमाणपत्र शैक्षणिक मूल्यांकन हेतु स्वचालित रूप से जनरेट किए गए हैं। ट्रस्ट की जानकारियां एवं रसीद नंबर वास्तविक कानूनी या कर छूट प्रयोजनों के लिए मान्य नहीं हैं।
          </p>
        </div>

        <div className="pt-2 flex justify-center space-x-4">
          <Link
            href="/"
            className="text-xs font-hindi text-forest hover:underline font-semibold"
          >
            ← मुख्य पृष्ठ पर जाएं
          </Link>
          <span className="text-[#E8E5DD]">•</span>
          <Link
            href="/donor"
            className="text-xs font-hindi text-forest hover:underline font-semibold"
          >
            मेरा दान इतिहास देखें →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-16 text-center font-hindi text-charcoal">लोड हो रहा है...</div>}>
      <DonationSuccessContent />
    </Suspense>
  );
}

