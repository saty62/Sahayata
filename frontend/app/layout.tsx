import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'सहायता (Sahayata) — मध्य प्रदेश महिला कल्याण एवं सहयोग मंच',
  description:
    'मध्य प्रदेश की महिलाओं के लिए सरकारी योजनाओं की सरल खोज, पात्रता परीक्षण एवं कंपनी ए चैरिटेबल ट्रस्ट हेतु सुरक्षित दान प्रबंधन मंच।',
  keywords: [
    'मध्य प्रदेश महिला कल्याण',
    'विधवा पेंशन योजना',
    'लाड़ली बहना',
    'स्वयं सहायता समूह ऋण',
    'मातृत्व वंदना',
    '80G दान कर छूट',
    'Company A Charitable Trust',
    'Bhopal NGO',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#245C46',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#252B27] antialiased">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
