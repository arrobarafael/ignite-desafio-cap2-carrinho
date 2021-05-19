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
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
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

  const existProductInCart = (productId: number) => {
    const quantity = cart.filter((item) => {
      return item.id === productId;
    });
    return quantity.length;
  };

  const addProduct = async (productId: number) => {
    try {
      const { data: selectedProduct } = await api.get(`products/${productId}`);
      const { data: stock } = await api.get(`stock/${productId}`);
      let newAmount = false;

      if (selectedProduct) {
        if (existProductInCart(productId)) {
          const updatedCart = cart.map((item) => {
            if (item.id === productId) {
              if (item.amount + 1 <= stock.amount) {
                item.amount += 1;
                newAmount = true;
              } else {
                toast.error('Quantidade solicitada fora de estoque');
              }
            }
            return item;
          });
          if (newAmount) {
            setCart([...updatedCart]);
            localStorage.setItem(
              '@RocketShoes:cart',
              JSON.stringify([...updatedCart])
            );
          }
        } else {
          if (stock.amount >= 1) {
            selectedProduct.amount = 1;
            const updatedCart = [...cart, selectedProduct];
            setCart(updatedCart);
            localStorage.setItem(
              '@RocketShoes:cart',
              JSON.stringify(updatedCart)
            );
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        }
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (existProductInCart(productId)) {
        const updatedCart = cart.filter((item) => item.id !== productId);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`);
      let newAmount = false;

      if (amount > 0) {
        if (existProductInCart(productId)) {
          const updatedCart = cart.map((item) => {
            if (item.id === productId) {
              if (amount <= stock.amount) {
                item.amount = amount;
                newAmount = true;
              } else {
                toast.error('Quantidade solicitada fora de estoque');
              }
            }
            return item;
          });

          if (newAmount) {
            setCart(updatedCart);
            localStorage.setItem(
              '@RocketShoes:cart',
              JSON.stringify(updatedCart)
            );
          }
        } else {
          throw new Error();
        }
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
