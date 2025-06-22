// app/layout.js
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../public/assets/css/dashlite.css';
import TopLoadingBar from '../app/components/loading';

import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './store/provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'IoT SaaS App',
  description: 'IoT SaaS Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`bg-lighter npc-general has-sidebar ${inter.className}`}>
        <Providers>
          {children}
        </Providers>
        <TopLoadingBar />

        {/* Scripts are okay here */}
        <Script src="/Content/assets/js/bundle.js?ver=1.4.0" strategy="afterInteractive" />
        <Script src="/Content/assets/js/scripts.js?ver=1.4.0" strategy="afterInteractive" />
      </body>
    </html>
  );
}
