import type {Metadata} from 'next';
import './globals.css';
import StoreProvider from './StoreProvider';

export const metadata: Metadata = {
    title: 'TeethTech CRM',
    description: 'Система управления зуботехнической лабораторией',
};

const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem('teethtech-theme');
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (_) {}
})();`;

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>
                <StoreProvider>
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
