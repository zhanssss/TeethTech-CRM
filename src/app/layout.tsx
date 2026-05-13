import type {Metadata} from 'next';
import './globals.css';
import StoreProvider from './StoreProvider';

export const metadata: Metadata = {
    title: 'TeethTech CRM',
    description: 'Система управления зуботехнической лабораторией',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru">
            <body>
                <StoreProvider>
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}