import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

// All dashboard pages require auth - disable static pre-rendering
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
