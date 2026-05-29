import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ensureDatabase } from "@/actions/db-init";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureDatabase();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
