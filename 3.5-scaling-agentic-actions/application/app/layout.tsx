import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./markdown.css";
import { ToastContainer } from "react-toastify";
import ToastProvider from "@/app/components/ui/toast/toast-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parato Demo",
  description: "Built with Paragon and LlamaIndex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
        <body className={inter.className}>
          <ToastProvider>
             {children}
          </ToastProvider>
        </body>
    </html>
  );
}
