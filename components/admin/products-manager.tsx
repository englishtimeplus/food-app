"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  exportProductsCsv,
  searchProducts,
  updateProduct,
} from "@/actions/products";
import type { Product } from "@/lib/types";
import { formatDateTime, formatPeso } from "@/lib/format";
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

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const load = useCallback(() => {
    startTransition(async () => {
      const fromIso = from ? new Date(from).toISOString() : undefined;
      const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : undefined;
      const data = await searchProducts(query || undefined, fromIso, toIso);
      setProducts(data);
    });
  }, [query, from, to]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const resetForm = () => {
    setName("");
    setImageUrl("");
    setPrice("");
    setCategory("");
    setEditing(null);
  };

  const handleSave = () => {
    const p = parseFloat(price);
    if (!name.trim() || !imageUrl.trim() || !category.trim() || isNaN(p)) return;
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        image_url: imageUrl.trim(),
        price: p,
        category: category.trim(),
      };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      setOpen(false);
      resetForm();
      load();
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this product?")) return;
    startTransition(async () => {
      await deleteProduct(id);
      load();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <DateFilters from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        </div>
        <div className="flex gap-2">
          <ExportButton label="products" exportAction={exportProductsCsv} />
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
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Product" : "Create Product"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                </div>
                <div>
                  <Label>Price (₱)</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="main, soup/stew, drink…" />
                </div>
                <Button onClick={handleSave} disabled={pending}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border bg-white">
            <div className="relative h-32 bg-zinc-100">
              <Image src={p.image_url} alt={p.name} fill className="object-cover" />
            </div>
            <div className="p-3">
              <p className="font-semibold">{p.name}</p>
              <p className="text-orange-600">{formatPeso(p.price)}</p>
              <p className="text-xs text-zinc-500">{p.category} · {formatDateTime(p.created_at)}</p>
              <div className="mt-2 flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(p);
                    setName(p.name);
                    setImageUrl(p.image_url);
                    setPrice(p.price);
                    setCategory(p.category);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-center text-zinc-500">No products found</p>
      )}
    </div>
  );
}
