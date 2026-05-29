import { getUsers } from "@/actions/users";
import { UsersManager } from "@/components/admin/users-manager";

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <UsersManager initialUsers={users} />
    </div>
  );
}
