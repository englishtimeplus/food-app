"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ClipboardList, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCustomerOrder,
  getOrdersByUserNamePaginated,
  updateCustomerOrder,
} from "@/actions/orders";
import { getProducts } from "@/actions/products";
import type { OrderStatus, OrderWithItems, Product } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCustomerName } from "./customer-name-context";

const PAGE_SIZE = 20;

type EditLine = {
  productId: number;
  quantity: number;
  option: string;
};

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

export function OrderHistorySheet() {
  const { customerName, hydrated, openNameDialog } = useCustomerName();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, startTransition] = useTransition();
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const loadOrders = useCallback(() => {
    if (!customerName.trim()) return;
    startTransition(async () => {
      const { orders: data, hasMore: more } = await getOrdersByUserNamePaginated(
        customerName,
        PAGE_SIZE,
        0
      );
      setOrders(data);
      setHasMore(more);
    });
  }, [customerName]);

  const loadMoreOrders = () => {
    if (!customerName.trim() || loadingMore || pending || !hasMore) return;
    const offset = orders.length;
    setLoadingMore(true);
    startTransition(async () => {
      try {
        const { orders: data, hasMore: more } = await getOrdersByUserNamePaginated(
          customerName,
          PAGE_SIZE,
          offset
        );
        setOrders((prev) => [...prev, ...data]);
        setHasMore(more);
      } finally {
        setLoadingMore(false);
      }
    });
  };

  useEffect(() => {
    if (open && customerName.trim()) loadOrders();
  }, [open, customerName, loadOrders]);

  const handleOpen = (next: boolean) => {
    if (next && hydrated && !customerName.trim()) {
      openNameDialog();
      return;
    }
    if (!next) {
      setOrders([]);
      setHasMore(false);
    }
    setOpen(next);
  };

  const startEdit = async (order: OrderWithItems) => {
    if (order.status !== "pending") {
      alert("Only pending orders can be edited.");
      return;
    }
    const prods = products.length > 0 ? products : await getProducts();
    setProducts(prods);
    setEditingOrder(order);
    setEditLines(
      order.items.map((i) => ({
        productId: i.product_id,
        quantity: i.quantity,
        option: i.option ?? "",
      }))
    );
  };

  const saveEdit = () => {
    if (!editingOrder) return;
    startTransition(async () => {
      try {
        await updateCustomerOrder({
          orderId: editingOrder.id,
          userName: customerName,
          items: editLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            option: l.option || null,
          })),
        });
        setEditingOrder(null);
        loadOrders();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to update");
      }
    });
  };

  const handleDelete = (orderId: number) => {
    if (!confirm("Delete this order?")) return;
    startTransition(async () => {
      try {
        await deleteCustomerOrder(orderId, customerName);
        loadOrders();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Order history">
            <ClipboardList className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order history</DialogTitle>
            {customerName && (
              <p className="text-sm text-zinc-500">Customer: {customerName}</p>
            )}
          </DialogHeader>

          {!customerName.trim() ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-zinc-500">Please enter your name first.</p>
              <Button onClick={openNameDialog}>Enter your name</Button>
            </div>
          ) : pending && orders.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Order #{order.id}</p>
                      <p className="text-xs text-zinc-500">{formatDateTime(order.created_at)}</p>
                    </div>
                    <Badge variant={statusVariant(order.status)} className="capitalize shrink-0">
                      {order.status}
                    </Badge>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.product_name} × {item.quantity}
                        {item.option ? ` (${item.option})` : ""}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={order.status !== "pending"}
                      onClick={() => startEdit(order)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {hasMore && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loadingMore || pending}
                  onClick={loadMoreOrders}
                >
                  {loadingMore ? <Spinner className="size-4" /> : null}
                  more+
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingOrder} onOpenChange={(v) => !v && setEditingOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit order #{editingOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editLines.map((line, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border p-3">
                <Label>Menu</Label>
                <Select
                  value={line.productId.toString()}
                  onValueChange={(v) =>
                    setEditLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, productId: parseInt(v, 10) } : l
                      )
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setEditLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, quantity: Math.max(1, l.quantity - 1) } : l
                        )
                      )
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center">{line.quantity}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setEditLines((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + 1 } : l))
                      )
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Label>Option (optional)</Label>
                <Input
                  value={line.option}
                  onChange={(e) =>
                    setEditLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, option: e.target.value } : l))
                    )
                  }
                  placeholder="e.g. Weight: 500g"
                />
                {editLines.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() =>
                      setEditLines((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Remove item
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const first = products[0];
                if (!first) return;
                setEditLines((prev) => [
                  ...prev,
                  { productId: first.id, quantity: 1, option: "" },
                ]);
              }}
            >
              Add item
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveEdit} disabled={pending}>
                Save
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditingOrder(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
