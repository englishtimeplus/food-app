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
import type { Product, ProductOptionInput } from "@/lib/types";
import { formatDateTime, formatPeso } from "@/lib/format";
import { formatProductPrice } from "@/lib/product-options";
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

type OptionRow = { label: string; price: string };

function emptyOptionRow(): OptionRow {
  return { label: "", price: "" };
}

function optionsFromProduct(product: Product): OptionRow[] {
  if (!product.options?.length) return [];
  return product.options.map((o) => ({ label: o.label, price: o.price }));
}

function parseOptions(rows: OptionRow[]): ProductOptionInput[] {
  return rows
    .map((r) => ({ label: r.label.trim(), price: parseFloat(r.price) }))
    .filter((o) => o.label && !isNaN(o.price));
}

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
  const [optionRows, setOptionRows] = useState<OptionRow[]>([]);

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
    setOptionRows([]);
    setEditing(null);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setImageUrl(p.image_url);
    setPrice(p.price);
    setCategory(p.category);
    setOptionRows(optionsFromProduct(p));
    setOpen(true);
  };

  const handleSave = () => {
    const p = parseFloat(price);
    if (!name.trim() || !imageUrl.trim() || !category.trim() || isNaN(p)) return;
    const options = parseOptions(optionRows);
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        image_url: imageUrl.trim(),
        price: p,
        category: category.trim(),
      };
      if (editing) {
        await updateProduct(editing.id, payload, options);
      } else {
        await createProduct(payload, options);
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
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
                  <Label>Base price (₱)</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                  <p className="mt-1 text-xs text-zinc-500">
                    Shown when no options. With options, customers see the option price range.
                  </p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="main, soup/stew, drink…" />
                </div>

                <div className="space-y-2 rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-orange-900">용량 선택 옵션</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setOptionRows((rows) => [...rows, emptyOptionRow()])}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add option
                    </Button>
                  </div>
                  {optionRows.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No options — fixed price only. Add rows for choices like 500g / 750g / 1000g.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {optionRows.map((row, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            placeholder="500g"
                            value={row.label}
                            onChange={(e) =>
                              setOptionRows((rows) =>
                                rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r))
                              )
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="₱"
                            value={row.price}
                            onChange={(e) =>
                              setOptionRows((rows) =>
                                rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r))
                              )
                            }
                            className="w-24"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="shrink-0 text-red-500"
                            onClick={() => setOptionRows((rows) => rows.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
              <p className="text-orange-600">{formatProductPrice(p)}</p>
              {(p.options?.length ?? 0) > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-zinc-600">
                  {p.options!.map((o) => (
                    <li key={o.id}>
                      {o.label} — {formatPeso(o.price)}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs text-zinc-500">{p.category} · {formatDateTime(p.created_at)}</p>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
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
