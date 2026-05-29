"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredCustomerName } from "@/lib/customer-name";
import { useCustomerName } from "./customer-name-context";

export function CustomerNameDialog() {
  const {
    customerName,
    setCustomerName,
    isNameDialogOpen,
    closeNameDialog,
  } = useCustomerName();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isNameDialogOpen) return;
    const stored = getStoredCustomerName();
    setName(stored ?? customerName ?? "");
  }, [isNameDialogOpen, customerName]);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomerName(trimmed);
    closeNameDialog();
  };

  return (
    <Dialog
      open={isNameDialogOpen}
      onOpenChange={(open) => {
        if (!open) closeNameDialog();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter your name</DialogTitle>
          <DialogDescription>
            Enter the name to use when placing orders. We&apos;ll remember it for next time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="customer-name">Customer name</Label>
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleConfirm} disabled={!name.trim()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
