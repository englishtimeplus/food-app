"use client";

import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSheet } from "./cart-sheet";
import { OrderHistorySheet } from "./order-history-sheet";
import { useCustomerName } from "./customer-name-context";

export function SiteHeader() {
  const { customerName, hydrated, openNameDialog } = useCustomerName();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-orange-600">
            <UtensilsCrossed className="h-6 w-6" />
            Club Bites
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/order"
              className="text-sm font-semibold text-zinc-700 hover:text-orange-600"
            >
              Order
            </Link>
            <OrderHistorySheet />
            <CartSheet />
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0 truncate text-left">
            {hydrated && customerName ? (
              <span className="text-zinc-600">
                Welcome!{" "}
                <span className="font-semibold text-orange-700">{customerName}</span>
              </span>
            ) : hydrated ? (
              <span className="text-zinc-400">Welcome!</span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto shrink-0 px-0 py-0 text-xs font-medium text-orange-600 underline-offset-2 hover:underline"
            onClick={openNameDialog}
          >
            Change name
          </Button>
        </div>
      </div>
    </header>
  );
}
