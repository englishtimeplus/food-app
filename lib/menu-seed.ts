/** Bump when menu should be re-synced to the database */
export const MENU_SEED_VERSION = 2;

export const CLUB_MENU = [
  {
    name: "Kimbap",
    price: 150,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1529042410759-befb1204bda8?w=400",
  },
  {
    name: "Tteokbokki",
    price: 150,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400",
  },
  {
    name: "Kimchi Fried Rice",
    price: 150,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1603133872871-684f608f2617?w=400",
  },
  {
    name: "Kimchi",
    price: 200,
    category: "side",
    image_url: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
  },
  {
    name: "Kimchi stew",
    price: 200,
    category: "soup/stew",
    image_url: "https://images.unsplash.com/photo-1604908176997-4310ef922b86?w=400",
  },
  {
    name: "Bibimbap",
    price: 150,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400",
  },
  {
    name: "Samgyupsal (K-BBQ)",
    price: 200,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1529193591184-b1d58069ec66?w=400",
  },
] as const;

/** Default weight options for products that support 용량 선택 */
export const DEFAULT_WEIGHT_OPTIONS = [
  { label: "500g", price: 200 },
  { label: "750g", price: 300 },
  { label: "1000g", price: 400 },
] as const;

export const PRODUCTS_WITH_WEIGHT_OPTIONS = new Set(["Kimchi", "Kimchi stew"]);
