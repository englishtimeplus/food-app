"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ClipboardList, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCustomerOrder,
  getOrdersByUserName,
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
import { useCustomerName } from "./customer-name-context";

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
  const [pending, startTransition] = useTransition();
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const loadOrders = useCallback(() => {
    if (!customerName.trim()) return;
    startTransition(async () => {
      const data = await getOrdersByUserName(customerName);
      setOrders(data);
    });
  }, [customerName]);

  useEffect(() => {
    if (open && customerName.trim()) loadOrders();
  }, [open, customerName, loadOrders]);

  const handleOpen = (next: boolean) => {
    if (next && hydrated && !customerName.trim()) {
      openNameDialog();
      return;
    }
    setOpen(next);
  };

  const startEdit = async (order: OrderWithItems) => {
    if (order.status !== "pending") {
      alert("대기 중인 주문만 수정할 수 있습니다.");
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
        alert(e instanceof Error ? e.message : "수정 실패");
      }
    });
  };

  const handleDelete = (orderId: number) => {
    if (!confirm("이 주문을 삭제할까요?")) return;
    startTransition(async () => {
      try {
        await deleteCustomerOrder(orderId, customerName);
        loadOrders();
      } catch (e) {
        alert(e instanceof Error ? e.message : "삭제 실패");
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="주문 이력">
            <ClipboardList className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>주문 이력</DialogTitle>
            {customerName && (
              <p className="text-sm text-zinc-500">주문자: {customerName}</p>
            )}
          </DialogHeader>

          {!customerName.trim() ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-zinc-500">주문자명을 먼저 입력해 주세요.</p>
              <Button onClick={openNameDialog}>주문자명 입력</Button>
            </div>
          ) : pending && orders.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">불러오는 중…</p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">주문 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">주문 #{order.id}</p>
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
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingOrder} onOpenChange={(v) => !v && setEditingOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>주문 수정 #{editingOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editLines.map((line, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border p-3">
                <Label>메뉴</Label>
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
                <Label>수량</Label>
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
                <Label>옵션 (선택)</Label>
                <Input
                  value={line.option}
                  onChange={(e) =>
                    setEditLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, option: e.target.value } : l))
                    )
                  }
                  placeholder="예: Weight: 500g"
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
                    항목 삭제
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
              메뉴 추가
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveEdit} disabled={pending}>
                저장
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditingOrder(null)}>
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
