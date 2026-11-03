'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Heart,
  ShieldCheck,
  CreditCard,
  Building,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  IndianRupee,
  ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';
import { Campaign } from '@/types';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

function DonationCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCampaignId = searchParams?.get('campaignId');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationType, setDonationType] = useState<'ONE_TIME' | 'MONTHLY_SIMULATED'>('ONE_TIME');

  // Step 2: Donor Details
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donorPan, setDonorPan] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Bhopal');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('462011');

  // Step 3: Payment Simulation State
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD'>('UPI');
  const [isForeignCard, setIsForeignCard] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Created Donation ID after step 2
  const [createdDonationId, setCreatedDonationId] = useState<string | null>(null);

  useEffect(() => {
    // Load active campaigns
    api.getCampaigns('ACTIVE')
      .then((res) => {
        if (res.success && res.data?.campaigns?.length > 0) {
          setCampaigns(res.data.campaigns);
          if (preselectedCampaignId) {
            setSelectedCampaignId(preselectedCampaignId);
          } else {
            setSelectedCampaignId(res.data.campaigns[0]._id);
          }
        }
      })
      .catch((err) => console.error(err));

    // Pre-fill user details if logged in
    api.getMe()
      .then((res) => {
        if (res.success && res.data?.user) {
          const u = res.data.user;
          setDonorName(u.name || '');
          setDonorEmail(u.email || '');
          setDonorMobile(u.mobile || '');
          setDonorPan(u.pan || '');
          if (u.address) {
            setStreet(u.address.street || '');
            setCity(u.address.city || 'Bhopal');
            setState(u.address.state || 'Madhya Pradesh');
            setPincode(u.address.pincode || '462011');
          }
        }
      })
      .catch(() => {});
  }, [preselectedCampaignId]);

  const handlePresetClick = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    if (val && parseInt(val, 10) > 0) {
      setAmount(parseInt(val, 10));
    }
  };

  // Step 1 to Step 2 Validation
  const handleProceedToDetails = () => {
    if (!selectedCampaignId) {
      setError('कृपया सहयोग हेतु एक अभियान का चयन करें।');
      return;
    }
    if (!amount || amount < 100) {
      setError('न्यूनतम सहयोग राशि ₹100 है।');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 to Step 3: Create Pending Donation record
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || !donorEmail.trim() || !donorMobile.trim()) {
      setError('कृपया नाम, ईमेल एवं मोबाइल नंबर अनिवार्य रूप से भरें।');
      return;
    }

    if (donorPan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(donorPan.trim())) {
      setError('कृपया सही पैन कार्ड नंबर दर्ज करें (उदा. ABCDE1234F) या खाली छोड़ें।');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const payload = {
        campaignId: selectedCampaignId,
        amount,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        donorMobile: donorMobile.trim(),
        donorPan: donorPan.trim() ? donorPan.trim().toUpperCase() : undefined,
        donorAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
        donationType,
        paymentMode,
      };

      const res = await api.createDonation(payload);
      if (res.success && res.data?.donation) {
        setCreatedDonationId(res.data.donation._id);
        setStep(3);
      } else {
        setError(res.message || 'दान आदेश आरंभ करने में विफल।');
      }
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setProcessing(false);
    }
  };

  // Final Step 3: Execute Mock Payment
  const handleExecutePayment = async (shouldSucceed: boolean) => {
    if (!createdDonationId) return;

    if (isForeignCard) {
      setError(
        'विदेशी कार्ड स्वीकार्य नहीं हैं। statutory compliance (FCRA) के अंतर्गत यह ट्रस्ट केवल भारतीय बैंक खातों एवं कार्ड्स से दान स्वीकार करता है।'
      );
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const res = await api.mockPayment(createdDonationId, {
        shouldSucceed,
        paymentMode,
        isForeignCard,
        transactionRef: `MOCK-TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });

      if (shouldSucceed && res.success) {
        router.push(`/donate/success?id=${createdDonationId}`);
      } else {
        setError(res.message || 'भुगतान असफल रहा जैसा कि परीक्षण मोड में चुना गया।');
      }
    } catch (err: any) {
      setError(err.message || 'भुगतान पुष्टिकरण में त्रुटि।');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="px-4 py-1.5 rounded-full bg-forest/10 text-forest text-xs font-bold font-hindi inline-flex items-center shadow-soft-sm">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-forest" />
          <span>सुरक्षित दान एवं तत्काल 80G कर छूट रसीद</span>
        </span>
        <h1 className="heading-hindi text-3xl sm:text-4xl font-extrabold text-charcoal">
          दान सहयोग (Contribute)
        </h1>
        <p className="font-hindi text-xs sm:text-sm text-charcoal-muted max-w-lg mx-auto">
          केवल 3 सरल चरणों में आपका सहयोग सीधे मध्य प्रदेश की जरूरतमंद महिलाओं तक पहुंचेगा।
        </p>
      </div>

      {/* 3-Step Progress Indicators */}
      <nav aria-label="दान प्रगति" className="flex items-center justify-between bg-white p-4 rounded-2xl border border-ivory-border shadow-soft-sm">
        <div className={`flex items-center space-x-2 text-xs font-hindi ${step >= 1 ? 'text-forest font-bold' : 'text-charcoal-light'}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-sans ${step >= 1 ? 'bg-forest text-white' : 'bg-sage/40'}`}>1</span>
          <span>अभियान व राशि</span>
        </div>
        <div className={`flex-grow h-0.5 mx-3 ${step >= 2 ? 'bg-forest' : 'bg-ivory-border'}`} />
        <div className={`flex items-center space-x-2 text-xs font-hindi ${step >= 2 ? 'text-forest font-bold' : 'text-charcoal-light'}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-sans ${step >= 2 ? 'bg-forest text-white' : 'bg-sage/40'}`}>2</span>
          <span>दानदाता विवरण</span>
        </div>
        <div className={`flex-grow h-0.5 mx-3 ${step >= 3 ? 'bg-forest' : 'bg-ivory-border'}`} />
        <div className={`flex items-center space-x-2 text-xs font-hindi ${step >= 3 ? 'text-forest font-bold' : 'text-charcoal-light'}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-sans ${step >= 3 ? 'bg-forest text-white' : 'bg-sage/40'}`}>3</span>
          <span>भुगतान परीक्षण</span>
        </div>
      </nav>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-hindi border border-red-200 flex items-start space-x-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CAMPAIGN & AMOUNT SELECTION */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-ivory-border shadow-soft-sm space-y-8">
          {/* Campaign dropdown */}
          <div>
            <label htmlFor="select-campaign" className="block text-xs font-bold text-charcoal font-hindi mb-2">
              दान का उद्देश्य / अभियान चुनें (Select Campaign) *
            </label>
            <select
              id="select-campaign"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest cursor-pointer touch-target"
            >
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nameHindi} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* Donation Type: One-time vs Simulated Monthly */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-charcoal font-hindi">
              दान का प्रकार (Donation Frequency):
            </span>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setDonationType('ONE_TIME')}
                className={`py-3.5 rounded-2xl text-xs font-hindi font-bold border transition-all touch-target ${
                  donationType === 'ONE_TIME'
                    ? 'bg-forest text-white border-forest shadow-soft-sm'
                    : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                }`}
                aria-pressed={donationType === 'ONE_TIME'}
              >
                एकमुश्त दान (One-Time)
              </button>

              <button
                type="button"
                onClick={() => setDonationType('MONTHLY_SIMULATED')}
                className={`py-3.5 rounded-2xl text-xs font-hindi font-bold border transition-all touch-target ${
                  donationType === 'MONTHLY_SIMULATED'
                    ? 'bg-forest text-white border-forest shadow-soft-sm'
                    : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                }`}
                aria-pressed={donationType === 'MONTHLY_SIMULATED'}
              >
                मासिक दान (Simulated Monthly) *
              </button>
            </div>
            {donationType === 'MONTHLY_SIMULATED' && (
              <p className="text-[11px] text-amber-900 font-hindi bg-amber-50 p-3 rounded-xl border border-amber-200">
                * ध्यान दें: यह मासिक दान केवल प्रदर्शन व परीक्षण हेतु है (Simulated mode)। कोई वास्तविक आवर्ती मैंडेट नहीं बनाया जाएगा।
              </p>
            )}
          </div>

          {/* Amount Presets */}
          <div className="space-y-3">
            <span className="block text-xs font-bold text-charcoal font-hindi">
              सहयोग राशि चुनें (Select Amount) *
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetClick(val)}
                  className={`py-4 rounded-2xl text-base font-extrabold border transition-all font-sans touch-target ${
                    amount === val && !customAmount
                      ? 'bg-forest text-white border-forest shadow-soft-sm ring-2 ring-accent'
                      : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                  }`}
                  aria-pressed={amount === val && !customAmount}
                >
                  ₹{val.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="pt-2">
              <label htmlFor="custom-amount-input" className="block text-xs font-bold text-charcoal-muted font-hindi mb-1">
                अथवा अपनी इच्छानुसार राशि दर्ज करें (Custom Amount):
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal font-bold">
                  ₹
                </span>
                <input
                  id="custom-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="अन्य राशि (उदा. 2500)"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-sm font-bold text-forest focus:ring-2 focus:ring-forest font-sans touch-target"
                />
              </div>
            </div>
          </div>

          {/* Tax Exemption Note */}
          <div className="bg-sage/40 p-4 rounded-2xl border border-sage-dark/40 flex items-center space-x-3 text-xs text-forest font-hindi">
            <ShieldCheck className="w-5 h-5 text-forest shrink-0" />
            <span>
              आपके द्वारा दिए गए ₹{amount.toLocaleString('en-IN')} के दान पर धारा 80G के तहत 50% कर छूट प्राप्त होगी।
            </span>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToDetails}
              className="px-8 py-4 rounded-2xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover shadow-soft-sm flex items-center touch-target"
            >
              <span>चरण 2: दानदाता विवरण (Proceed to Details)</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DONOR DETAILS */}
      {step === 2 && (
        <form onSubmit={handleProceedToPayment} className="bg-white rounded-3xl p-6 sm:p-10 border border-ivory-border shadow-soft-sm space-y-6">
          <div className="pb-4 border-b border-ivory-border">
            <h2 className="font-hindi text-xl font-bold text-charcoal">
              दानदाता की व्यक्तिगत जानकारी
            </h2>
            <p className="text-xs text-charcoal-muted font-hindi mt-0.5">
              आयकर विभाग के नियम 18AB के अनुसार 80G रसीद जारी करने हेतु नाम और पता आवश्यक है।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="donor-fullname" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                पूरा नाम (Full Name as per PAN) *
              </label>
              <input
                id="donor-fullname"
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="उदा. राजेश वर्मा"
                autoComplete="name"
                className="w-full px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest touch-target"
              />
            </div>

            <div>
              <label htmlFor="donor-email" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                ईमेल पता (Email Address for Receipt) *
              </label>
              <input
                id="donor-email"
                type="email"
                required
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="rajesh@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-sm text-charcoal focus:ring-2 focus:ring-forest touch-target"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="donor-mobile" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                मोबाइल नंबर (Mobile Number) *
              </label>
              <input
                id="donor-mobile"
                type="tel"
                inputMode="numeric"
                required
                maxLength={10}
                value={donorMobile}
                onChange={(e) => setDonorMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10 अंकों का फोन नंबर"
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-sm text-charcoal font-mono focus:ring-2 focus:ring-forest touch-target"
              />
            </div>

            <div>
              <label htmlFor="donor-pan" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                पैन नंबर (PAN for 80G Tax Benefit)
              </label>
              <input
                id="donor-pan"
                type="text"
                maxLength={10}
                value={donorPan}
                onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                placeholder="उदा. ABCDE1234F"
                className="w-full px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-sm font-mono text-charcoal uppercase focus:ring-2 focus:ring-forest touch-target"
              />
              <span className="text-[11px] text-charcoal-muted font-hindi">
                80G कर छूट प्रमाण पत्र हेतु अनुशंसित
              </span>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3 pt-2">
            <span className="block text-xs font-bold text-charcoal font-hindi">
              पता (Address for 80G Certificate):
            </span>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="मकान/फ्लैट नं., सड़क या मोहल्ला"
              autoComplete="street-address"
              className="w-full px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-xs text-charcoal font-hindi touch-target"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="शहर (उदा. भोपाल)"
                autoComplete="address-level2"
                className="px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-xs text-charcoal font-hindi touch-target"
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="राज्य (उदा. मध्य प्रदेश)"
                autoComplete="address-level1"
                className="px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-xs text-charcoal font-hindi touch-target"
              />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="पिनकोड (462011)"
                autoComplete="postal-code"
                className="px-4 py-3 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-xs text-charcoal font-mono touch-target"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-2xl border border-ivory-border text-xs font-hindi text-charcoal hover:bg-sage/40 touch-target flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>पीछे (Back)</span>
            </button>

            <button
              type="submit"
              disabled={processing}
              className="px-8 py-4 rounded-2xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover disabled:opacity-50 shadow-soft-sm flex items-center touch-target"
            >
              <span>{processing ? 'तैयार किया जा रहा है...' : 'चरण 3: भुगतान परीक्षण (Proceed to Payment)'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PAYMENT SIMULATION */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-ivory-border shadow-soft-sm space-y-8">
          <div className="pb-4 border-b border-ivory-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-hindi text-xl font-bold text-charcoal">
                परीक्षण भुगतान गेटवे (Simulated Test Checkout)
              </h2>
              <p className="text-xs text-charcoal-muted font-hindi mt-0.5">
                यह एक सुरक्षित परीक्षण इंटरफ़ेस है। कोई वास्तविक शुल्क नहीं कटेगा।
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-charcoal-muted font-hindi">कुल राशि:</span>
              <div className="font-extrabold text-2xl text-forest font-sans">₹{amount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-3">
            <span className="block text-xs font-bold text-charcoal font-hindi">
              भुगतान माध्यम चुनें (Payment Mode):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { id: 'NET_BANKING', label: 'Net Banking', icon: Building },
                { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard },
                { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id as any)}
                    className={`p-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center space-y-2 touch-target ${
                      paymentMode === m.id
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={paymentMode === m.id}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statutory Foreign Card Block Toggle & Warning */}
          <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/70 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-hindi text-xs font-bold text-amber-950 flex items-center">
                <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-800 shrink-0" />
                विदेशी कार्ड परीक्षण टॉगल (Foreign Card Simulation):
              </span>
              <label className="flex items-center cursor-pointer text-xs font-semibold text-charcoal">
                <input
                  type="checkbox"
                  checked={isForeignCard}
                  onChange={(e) => setIsForeignCard(e.target.checked)}
                  className="rounded text-forest focus:ring-forest mr-2 w-4 h-4 touch-target"
                />
                <span className="font-hindi">विदेशी कार्ड का अनुकरण करें</span>
              </label>
            </div>
            <p className="text-[11px] text-amber-900 font-hindi leading-relaxed">
              वैधानिक सूचना: ट्रस्ट के नियमों के अंतर्गत केवल भारतीय बैंक खातों एवं घरेलू कार्ड्स से दान स्वीकार किया जाता है। विदेशी योगदान (FCRA) इस प्लेटफ़ॉर्म द्वारा अवरुद्ध है।
            </p>
          </div>

          {/* Test Buttons: Simulate Success vs Failure */}
          <div className="space-y-3 pt-2">
            <span className="block text-xs font-bold text-charcoal font-hindi">
              भुगतान परीक्षण क्रियाएं (Simulate Actions):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleExecutePayment(true)}
                className="py-4 px-6 rounded-2xl bg-emerald-700 text-white font-hindi font-bold text-sm hover:bg-emerald-800 transition-all shadow-soft-sm flex items-center justify-center space-x-2 disabled:opacity-50 touch-target"
              >
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>{processing ? 'प्रक्रिया चल रही है...' : 'सफल भुगतान करें (Simulate Success)'}</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleExecutePayment(false)}
                className="py-4 px-6 rounded-2xl border-2 border-red-300 bg-red-50 text-red-800 font-hindi font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 touch-target"
              >
                <AlertCircle className="w-5 h-5 text-red-700" />
                <span>असफल भुगतान अनुकरण (Simulate Failure)</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-hindi text-charcoal-muted hover:text-charcoal underline"
            >
              ← वापस विवरण संपादित करें
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DonationCheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-16 text-center font-hindi text-charcoal">लोड हो रहा है...</div>}>
      <DonationCheckoutContent />
    </Suspense>
  );
}
