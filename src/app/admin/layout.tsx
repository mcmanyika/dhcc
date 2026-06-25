import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}
