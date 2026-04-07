import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import Sidebar from "@/src/components/Sidebar";
import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header"; // Импортируем наш Redux-провайдер

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin", "cyrillic"], // Добавь cyrillic для русского языка
});

export const metadata: Metadata = {
    title: "TeethTech CRM",
    description: "Система управления зуботехнической лабораторией",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru">
        <body className="flex">
        <StoreProvider>
            <Sidebar/>
            <div className="flex-1 flex flex-col overflow-y-auto p-8">
                <Header/>
                <main className="h-[85vh]">
                    {children}
                </main>
            </div>
        </StoreProvider>
        </body>
        </html>
    );
}