'use client';

import React, { useState, useEffect } from 'react';
import { Phone, X, CheckCircle, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { api } from '@/lib/api';

interface HelpCallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeTitle?: string;
  schemeId?: string;
}

export default function HelpCallbackModal({
  isOpen,
  onClose,
  schemeTitle,
  schemeId,
}: HelpCallbackModalProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [district, setDistrict] = useState('Bhopal');
  const [preferredTime, setPreferredTime] = useState('प्रातः 10:00 से 1:00');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || mobile.length !== 10) {
      setError('कृपया सही नाम एवं 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.requestHelpCallback({
        name: name.trim(),
        mobile: mobile.trim(),
        district,
        schemeId,
        notes: `योजना: ${schemeTitle || 'सामान्य मार्गदर्शन'}, समय: ${preferredTime}`,
      });

      if (res.success) {
        setSubmitted(true);
        setTicketNumber(res.data?.ticketNumber || 'HLP-101');
      } else {
        setError(res.message || 'अनुरोध दर्ज नहीं हो सका।');
      }
    } catch (err: any) {
      setError(err.message || 'तकनीकी समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="callback-modal-title"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-soft-lg border border-ivory-border relative animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-charcoal-muted hover:text-charcoal p-2 rounded-full hover:bg-sage/40 transition-colors touch-target"
          aria-label="पॉपअप बंद करें (Close)"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="space-y-5">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 flex items-center justify-center text-forest border border-forest/20 shadow-soft-sm shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h2 id="callback-modal-title" className="font-hindi text-xl sm:text-2xl font-bold text-charcoal leading-tight">
                  निःशुल्क परामर्श कॉल का अनुरोध
                </h2>
                <p className="text-xs text-forest font-hindi font-medium mt-0.5">
                  {schemeTitle ? `${schemeTitle} संबंधी सहायता` : 'सरकारी योजनाओं हेतु व्यक्तिगत मार्गदर्शन'}
                </p>
              </div>
            </div>

            <p className="font-hindi text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              अपनी संपर्क जानकारी दर्ज करें। कंपनी ए ट्रस्ट की महिला कल्याण सहायिका 24 घंटे के भीतर आपको फोन करके आवेदन प्रक्रिया, आवश्यक दस्तावेज़ों और निकटतम केंद्र की पूरी जानकारी निःशुल्क देंगी।
            </p>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 text-red-800 text-xs font-hindi border border-red-200" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="callback-name" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                  आपका पूरा नाम (Full Name) *
                </label>
                <input
                  id="callback-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. सुनीता बाई पटेल"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl border border-ivory-border text-sm text-charcoal font-hindi focus:border-forest focus:ring-2 focus:ring-forest bg-[#FAF9F6] touch-target"
                />
              </div>

              <div>
                <label htmlFor="callback-mobile" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                  10 अंकों का मोबाइल नंबर (Mobile Number) *
                </label>
                <input
                  id="callback-mobile"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="98XXXXXXXX"
                  autoComplete="tel"
                  className="w-full px-4 py-3 rounded-xl border border-ivory-border text-sm text-charcoal focus:border-forest focus:ring-2 focus:ring-forest bg-[#FAF9F6] font-mono touch-target"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="callback-district" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    आपका जिला (District)
                  </label>
                  <select
                    id="callback-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-ivory-border text-xs font-hindi text-charcoal bg-[#FAF9F6] focus:border-forest touch-target"
                  >
                    <option value="Bhopal">भोपाल (Bhopal)</option>
                    <option value="Sehore">सीहोर (Sehore)</option>
                    <option value="Raisen">रायसेन (Raisen)</option>
                    <option value="Rajgarh">राजगढ़ (Rajgarh)</option>
                    <option value="Vidisha">विदिशा (Vidisha)</option>
                    <option value="Hoshangabad">होशंगाबाद (Narmadapuram)</option>
                    <option value="Jabalpur">जबलपुर (Jabalpur)</option>
                    <option value="Indore">इंदौर (Indore)</option>
                    <option value="Gwalior">ग्वालियर (Gwalior)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="callback-time" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    कॉल का सुविधाजनक समय
                  </label>
                  <select
                    id="callback-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-ivory-border text-xs font-hindi text-charcoal bg-[#FAF9F6] focus:border-forest touch-target"
                  >
                    <option value="प्रातः 10:00 से 1:00">प्रातः 10:00 - 1:00 बजे</option>
                    <option value="दोपहर 1:00 से 4:00">दोपहर 1:00 - 4:00 बजे</option>
                    <option value="सायं 4:00 से 6:00">सायं 4:00 - 6:00 बजे</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover transition-colors shadow-soft-sm disabled:opacity-50 touch-target flex items-center justify-center space-x-2"
                >
                  <Phone className="w-4 h-4 text-accent" />
                  <span>{submitting ? 'अनुरोध भेजा जा रहा है...' : 'कॉल अनुरोध दर्ज करें (Request Callback)'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-charcoal-muted font-hindi pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                <span>आपकी जानकारी पूर्णतः सुरक्षित एवं गोपनीय रखी जाती है</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-300">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="font-hindi text-2xl font-extrabold text-forest">
              अनुरोध सफलतापूर्वक दर्ज!
            </h2>

            <p className="font-hindi text-sm text-charcoal-muted leading-relaxed">
              धन्यवाद, <strong className="text-charcoal">{name}</strong> जी! आपका सहायता अनुरोध क्रमांक <span className="font-mono font-bold text-forest bg-sage/60 px-2 py-0.5 rounded border border-sage-dark/40">{ticketNumber}</span> दर्ज कर लिया गया है। हमारी सहायिका शीघ्र ही आपके नंबर <span className="font-mono font-bold text-charcoal">{mobile}</span> पर संपर्क करेंगी।
            </p>

            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-ivory-border text-xs text-charcoal-muted flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4 text-forest" />
              <span className="font-hindi font-medium">संभावित संपर्क समय: 24 घंटे के भीतर</span>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover touch-target"
              >
                ठीक है (Close)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
