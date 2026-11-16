import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/App';
import { LoginSheet, Navegacao, Topo } from '@/components/Shell';

const atkinson = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-atkinson', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-bricolage', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Renan Fernandes Cursos', template: '%s · Renan Fernandes Cursos' },
  description: 'Cursos de massoterapia em vídeo com Renan Fernandes: autocuidado para o dia a dia e formação para terapeutas.',
  icons: { icon: '/img/logo-cor.webp' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#13171C' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${atkinson.variable} ${bricolage.variable}`}>
      <body>
        <AppProvider>
          <div id="splash" role="status" aria-label="Carregando">
            <div className="sp">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo-cor.webp" alt="Renan Fernandes Massoterapia" />
              <div className="bar"><i /></div>
            </div>
          </div>
          <Topo />
          <Navegacao />
          <main>{children}</main>
          <LoginSheet />
        </AppProvider>
      </body>
    </html>
  );
}
