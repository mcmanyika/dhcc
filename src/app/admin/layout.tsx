import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="fixed inset-0 flex overflow-hidden bg-gray-50 dark:bg-slate-950">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopBar />
          <div className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}
