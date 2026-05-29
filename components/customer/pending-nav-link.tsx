"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function PendingNavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      <PendingNavLinkContent>{children}</PendingNavLinkContent>
    </Link>
  );
}

function PendingNavLinkContent({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", pending && "opacity-70")}
      aria-busy={pending}
      onClick={(e) => {
        if (pending) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {pending ? <Spinner className="size-3.5" /> : null}
      {children}
    </span>
  );
}

export function PendingButtonLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonVariants(), className)}>
      <PendingButtonLinkContent>{children}</PendingButtonLinkContent>
    </Link>
  );
}

function PendingButtonLinkContent({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const anchor = ref.current?.closest("a");
    if (!anchor) return;
    if (pending) {
      anchor.style.pointerEvents = "none";
      anchor.setAttribute("aria-disabled", "true");
    } else {
      anchor.style.pointerEvents = "";
      anchor.removeAttribute("aria-disabled");
    }
  }, [pending]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2",
        pending && "opacity-70"
      )}
      aria-busy={pending}
      onClick={(e) => {
        if (pending) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {pending ? <Spinner /> : null}
      {children}
    </span>
  );
}
