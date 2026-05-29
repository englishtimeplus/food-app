"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createUser,
  deleteUser,
  exportUsersCsv,
  searchUsers,
  updateUser,
} from "@/actions/users";
import type { User } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateFilters } from "./date-filters";
import { ExportButton } from "./export-button";

export function UsersManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const load = useCallback(() => {
    startTransition(async () => {
      const fromIso = from ? new Date(from).toISOString() : undefined;
      const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : undefined;
      const data = await searchUsers(query || undefined, fromIso, toIso);
      setUsers(data);
    });
  }, [query, from, to]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setEditing(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      if (editing) {
        await updateUser(editing.id, { name: name.trim(), email: email || null });
      } else {
        await createUser({ name: name.trim(), email: email || null });
      }
      setOpen(false);
      resetForm();
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this user?")) return;
    startTransition(async () => {
      await deleteUser(id);
      load();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <DateFilters from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        </div>
        <div className="flex gap-2">
          <ExportButton label="users" exportAction={exportUsersCsv} />
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button onClick={handleSave} disabled={pending}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-zinc-500">{u.email ?? "—"}</td>
                <td className="p-3 text-zinc-500">{formatDateTime(u.created_at)}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(u);
                        setName(u.name);
                        setEmail(u.email ?? "");
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-6 text-center text-zinc-500">No users found</p>
        )}
      </div>
    </div>
  );
}
