// src/app/dashboard/layout.tsx
import Navbar from "@/components/Navbar";
import DashboardWrapper from "@/components/DashboardWrapper";
import UpdatesNotification from "@/components/UpdatesNotification";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
        <Navbar />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-full">{children}</div>
        </main>
        {/* Campanita de actualizaciones */}
        <UpdatesNotification />
      </div>
    </DashboardWrapper>
  );
}
