import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
  operator: string;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({
    productId,
    amount,
    operator,
  }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const getProductInDatabase = async (productId: number) => {
    const { data } = await api.get('products');
    return data.filter((product: Product) => {
      product.amount = 0;
      return product.id === productId;
    });
  };

  const existProductInCart = (productId: number) => {
    const quantity = cart.filter((item) => {
      return item.id === productId;
    });
    return quantity.length;
  };

  const addProduct = async (productId: number) => {
    try {
      const [selectedProduct] = await getProductInDatabase(productId);
      if (selectedProduct) {
        if (existProductInCart(productId)) {
          const updatedCart = cart.map((item) => {
            if (item.id === productId) {
              item.amount += 1;
            }
            return item;
          });
          setCart([...updatedCart]);
        } else {
          selectedProduct.amount += 1;
          setCart([...cart, selectedProduct]);
        }
      }
      console.log(cart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      // TODO
    } catch {
      toast.error('Erro na adição do produto');
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter((item) => item.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
    operator,
  }: UpdateProductAmount) => {
    console.log('id: ', productId);
    console.log('amount: ', amount);

    try {
      // TODO
      const updatedCart = cart.map((item) => {
        if (item.id === productId) {
          if (operator === 'increment') {
            item.amount += 1;
          } else {
            item.amount -= 1;
          }
        }
        return item;
      });
      setCart(updatedCart);
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
