import { AdminShell } from "@/components/admin/admin-shell";
import { ensureDatabase } from "@/actions/db-init";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureDatabase();

  return <AdminShell>{children}</AdminShell>;
}
