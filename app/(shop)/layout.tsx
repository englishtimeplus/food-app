import { CartProvider } from "@/components/customer/cart-context";
import { CustomerNameProvider } from "@/components/customer/customer-name-context";
import { CustomerNameDialog } from "@/components/customer/customer-name-dialog";
import { SiteHeader } from "@/components/customer/site-header";

export const dynamic = "force-dynamic";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerNameProvider>
      <CartProvider>
        <CustomerNameDialog />
        <SiteHeader />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-8">{children}</main>
      </CartProvider>
    </CustomerNameProvider>
  );
}
