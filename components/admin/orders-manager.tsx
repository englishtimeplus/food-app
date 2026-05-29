"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteOrder,
  exportOrdersCsv,
  searchOrders,
  updateOrder,
  updateOrderStatus,
} from "@/actions/orders";
import type { OrderStatus, OrderWithItems } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateFilters } from "./date-filters";
import { ExportButton } from "./export-button";

const STATUSES: OrderStatus[] = ["pending", "preparing", "completed", "cancelled"];

function statusVariant(status: OrderStatus) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "preparing":
      return "warning" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export function OrdersManager({ initialOrders }: { initialOrders: OrderWithItems[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<OrderWithItems | null>(null);
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<OrderStatus>("pending");

  const load = useCallback(() => {
    startTransition(async () => {
      const fromIso = from ? new Date(from).toISOString() : undefined;
      const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : undefined;
      const data = await searchOrders(query || undefined, fromIso, toIso);
      setOrders(data);
    });
  }, [query, from, to]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleStatusChange = (id: number, newStatus: OrderStatus) => {
    startTransition(async () => {
      await updateOrderStatus(id, newStatus);
      load();
    });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    startTransition(async () => {
      await updateOrder(editing.id, { user_name: userName.trim(), status });
      setEditing(null);
      load();
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this order?")) return;
    startTransition(async () => {
      await deleteOrder(id);
      load();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search customer or order #…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <DateFilters from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        </div>
        <ExportButton label="orders" exportAction={exportOrdersCsv} />
      </div>

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-lg border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  Order #{o.id} — {o.user_name}
                </p>
                <p className="text-sm text-zinc-500">{formatDateTime(o.created_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(o.status)} className="capitalize">
                  {o.status}
                </Badge>
                <Select
                  value={o.status}
                  onValueChange={(v) => handleStatusChange(o.id, v as OrderStatus)}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditing(o);
                    setUserName(o.user_name);
                    setStatus(o.status);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleDelete(o.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
              {o.items.map((item) => (
                <li key={item.id} className="flex justify-between text-zinc-600">
                  <span>
                    {item.product_name} × {item.quantity}
                    {item.option ? ` (${item.option})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {orders.length === 0 && (
        <p className="text-center text-zinc-500">No orders found</p>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order #{editing?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Customer name</Label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveEdit} disabled={pending}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
