export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
  subTotal: number;
  priceFormatted: string;
}

export interface Stock {
  id: number;
  amount: number;
}
