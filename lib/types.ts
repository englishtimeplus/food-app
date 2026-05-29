export type OrderStatus = "pending" | "preparing" | "completed" | "cancelled";

export type User = {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
};

export type ProductOption = {
  id: number;
  product_id: number;
  label: string;
  price: string;
  sort_order: number;
};

export type Product = {
  id: number;
  name: string;
  image_url: string;
  price: string;
  category: string;
  created_at: string;
  options?: ProductOption[];
};

export type ProductOptionInput = {
  label: string;
  price: number;
};

export type Order = {
  id: number;
  user_name: string;
  created_at: string;
  status: OrderStatus;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  option: string | null;
  product_name?: string;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};
