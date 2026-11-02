import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Heart, Shield, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#245C46] text-white pt-16 pb-12 border-t-4 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/15">
          {/* Column 1: Organization Overview */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-accent">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="font-hindi font-bold text-2xl text-white">सहायता</span>
                <p className="text-xs text-sage">कंपनी ए चैरिटेबल ट्रस्ट</p>
              </div>
            </div>

            <p className="text-sm text-sage/90 font-hindi leading-relaxed">
              मध्य प्रदेश के 9 जिलों में ग्रामीण एवं वंचित महिलाओं के स्वास्थ्य, पोषण, आजीविका और सामाजिक सुरक्षा हेतु समर्पित पंजीकृत धर्मार्थ न्यास।
            </p>

            <div className="text-xs text-sage/75 space-y-1">
              <p>पंजीकरण क्र.: MP/BPL/TRUST/2018/8942</p>
              <p>80G प्रमाणन: CIT(E)/BPL/80G/2023-24/A-1089</p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-hindi text-base font-bold text-accent tracking-wide uppercase">
              योजनाएं एवं सेवाएं
            </h3>
            <ul className="space-y-2.5 text-sm text-sage/90 font-hindi">
              <li>
                <Link href="/?category=पेंशन" className="hover:text-white transition-colors">
                  विधवा एवं कल्याणी पेंशन
                </Link>
              </li>
              <li>
                <Link href="/?category=स्वास्थ्य" className="hover:text-white transition-colors">
                  मातृत्व पोषण एवं स्वास्थ्य
                </Link>
              </li>
              <li>
                <Link href="/?category=आजीविका" className="hover:text-white transition-colors">
                  स्वयं सहायता समूह ऋण
                </Link>
              </li>
              <li>
                <Link href="/?category=शिक्षा" className="hover:text-white transition-colors">
                  बालिका उच्च शिक्षा प्रोत्साहन
                </Link>
              </li>
              <li>
                <Link href="/eligibility" className="hover:text-white transition-colors text-accent font-medium">
                  → पात्रता खोजक (Eligibility Finder)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Free Helpline */}
          <div className="space-y-4">
            <h3 className="font-hindi text-base font-bold text-accent tracking-wide uppercase">
              निःशुल्क महिला हेल्पलाइन
            </h3>
            <div className="bg-white/10 p-4 rounded-xl space-y-2.5 border border-white/10">
              <div className="flex items-center space-x-3 text-white">
                <Phone className="w-5 h-5 text-accent" />
                <span className="text-lg font-bold tracking-wider">+91 755 240 8900</span>
              </div>
              <p className="text-xs text-sage font-hindi">
                सोमवार से शनिवार (प्रातः 9:00 - सायं 6:00) | सरकारी योजना संबंधी निःशुल्क परामर्श
              </p>
            </div>

            <div className="space-y-2 text-xs text-sage/90">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>14, अरेरा हिल्स, भोपाल, मध्य प्रदेश - 462011</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>sahayata@companya-trust.org</span>
              </div>
            </div>
          </div>

          {/* Column 4: Donor & Compliance Notice */}
          <div className="space-y-4">
            <h3 className="font-hindi text-base font-bold text-accent tracking-wide uppercase">
              दान एवं कर छूट (80G)
            </h3>
            <p className="text-xs text-sage/90 font-hindi leading-relaxed">
              इस मंच के माध्यम से किए गए प्रत्येक वैध दान पर आयकर अधिनियम 1961 की धारा 80G के अंतर्गत 50% कर छूट प्राप्त होती है। दान के तुरंत बाद स्वचालित 80G प्रमाणपत्र उपलब्ध कराया जाता है।
            </p>
            <div className="pt-2">
              <Link
                href="/donate"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-accent text-[#252B27] font-semibold text-xs hover:bg-accent-dark transition-colors"
              >
                <Heart className="w-4 h-4 mr-1.5 fill-current" />
                <span>अभी दान करें (Donate Now)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mandatory Illustrative Demonstration Notice */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-sage/75 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="font-hindi">
              शैक्षणिक एवं तकनीकी मूल्यांकन हेतु निर्मित प्रदर्शन मंच (Fictional Trust Demo Data)
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>© 2026 Company A Charitable Trust</span>
            <Link href="/admin" className="text-sage/60 hover:text-white underline">
              एडमिन पोर्टल
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
