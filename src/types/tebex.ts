export type TebexImage = {
  id?: number;
  url?: string;
  image?: string;
  src?: string;
};

export type TebexPackage = {
  id: number;
  name: string;
  description: string;
  image?: TebexImage | string | null;
  images?: Array<TebexImage | string> | null;
  gallery?: Array<TebexImage | string> | null;
  variables?: TebexPackageVariable[];
  currency?: string;
  total_price: number;
  disable_quantity?: boolean;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
};

export type TebexPackageVariable = {
  identifier?: string;
  name?: string;
  type?: string;
  description?: string;
  required?: boolean;
};

export type TebexCategory = {
  id: number;
  name: string;
  slug: string;
  packages: TebexPackage[];
};

export type TebexListingsResponse = {
  data: {
    categories: TebexCategory[];
    packages: TebexPackage[];
  };
};

export type TebexBasket = {
  ident: string;
  complete: boolean;
  username_id?: number | null;
  username?: string | null;
  coupons?: Array<{ coupon_code?: string }>;
  giftcards?: Array<{ card_number?: string }>;
  creator_code?: string | null;
  base_price: number;
  sales_tax: number;
  total_price: number;
  currency:
    | string
    | {
        iso_4217: string;
        symbol: string;
      };
  links: {
    checkout: string;
    [key: string]: string;
  };
  packages: Array<{
    id?: number;
    package_id?: number;
    name?: string | { name?: string };
    quantity?: number | { quantity?: number };
    qty?:
      | number
      | {
          quantity?: number;
          price?: number;
          gift_username_id?: string;
          gift_username?: string;
        };
    in_basket?: number;
    total_price?: number;
    type?: string;
  }>;
};
