'use client';

import React, { useState } from 'react';
import { Phone, X, CheckCircle, Clock } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      setError('कृपया नाम एवं 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.requestHelpCallback({
        name,
        mobile,
        district,
        schemeId,
        notes: `योजना: ${schemeTitle || 'सामान्य'}, समय: ${preferredTime}`,
      });

      if (res.success) {
        setSubmitted(true);
        setTicketNumber(res.data?.ticketNumber || 'HLP-101');
      } else {
        setError(res.message || 'अनुरोध दर्ज नहीं हो सका।');
      }
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-soft-lg border border-[#E8E5DD] relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-charcoal-muted hover:text-charcoal p-1.5 rounded-full hover:bg-sage/40 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 flex items-center justify-center text-forest">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-hindi text-xl font-bold text-charcoal">
                  निःशुल्क सहायता कॉल का अनुरोध
                </h3>
                <p className="text-xs text-charcoal-muted">
                  {schemeTitle ? `${schemeTitle}` : 'सरकारी योजनाओं हेतु व्यक्तिगत मार्गदर्शन'}
                </p>
              </div>
            </div>

            <p className="font-hindi text-sm text-charcoal-muted leading-relaxed">
              अपनी जानकारी दें। हमारी महिला कल्याण सहायिका 24 घंटे के भीतर आपको फोन करके आवेदन प्रक्रिया में पूर्ण सहयोग करेंगी।
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-hindi border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal font-hindi mb-1">
                  आपका पूरा नाम (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. सुनीता बाई"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] text-sm text-charcoal font-hindi focus:border-forest focus:ring-1 focus:ring-forest bg-[#FAF9F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal font-hindi mb-1">
                  मोबाइल नंबर (Mobile Number) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 अंकों का फोन नंबर"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] text-sm text-charcoal focus:border-forest focus:ring-1 focus:ring-forest bg-[#FAF9F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal font-hindi mb-1">
                    जिला (District)
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E5DD] text-xs font-hindi text-charcoal bg-[#FAF9F6] focus:border-forest"
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
                  <label className="block text-xs font-semibold text-charcoal font-hindi mb-1">
                    सुविधाजनक समय
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E5DD] text-xs font-hindi text-charcoal bg-[#FAF9F6] focus:border-forest"
                  >
                    <option value="प्रातः 10:00 से 1:00">प्रातः 10 - 1 बजे</option>
                    <option value="दोपहर 1:00 से 4:00">दोपहर 1 - 4 बजे</option>
                    <option value="सायं 4:00 से 6:00">सायं 4 - 6 बजे</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-forest text-white font-hindi font-semibold text-sm hover:bg-forest-hover transition-colors shadow-soft-sm disabled:opacity-50"
                >
                  {submitting ? 'अनुरोध भेजा जा रहा है...' : 'कॉल अनुरोध दर्ज करें (Request Callback)'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h3 className="font-hindi text-2xl font-bold text-forest">
              अनुरोध सफलतापूर्वक दर्ज!
            </h3>

            <p className="font-hindi text-sm text-charcoal-muted leading-relaxed">
              धन्यवाद, {name} जी! आपका सहायता अनुरोध क्रमांक <span className="font-mono font-bold text-forest">{ticketNumber}</span> दर्ज कर लिया गया है। हमारी सहायिका शीघ्र ही आपके नंबर <span className="font-semibold text-charcoal">{mobile}</span> पर संपर्क करेंगी।
            </p>

            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#E8E5DD] text-xs text-charcoal-muted flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4 text-forest" />
              <span className="font-hindi">संभावित संपर्क समय: 24 घंटे के भीतर</span>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-forest text-white font-hindi font-medium text-sm hover:bg-forest-hover"
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
