import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Courts After Dark | Fair Sports Facility Booking & Management Platform",
  description:
    "Discover courts, grounds and gym facilities, check live slot availability, book fairly without monopolisation, and check out sports equipment.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-dark-900 text-slate-100 antialiased selection:bg-primary-400 selection:text-dark-950">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
