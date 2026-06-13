import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Beta — your college portfolio",
  description: "Apply to college like you'd build an investment portfolio. Stay informed; pop the bubble.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
