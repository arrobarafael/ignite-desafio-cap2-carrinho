import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
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
  // const [stock, setStock] = useState<Stock[]>([]);
  let stock: Stock[];
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const checkAvaliableStock = (productId: number, amount: number) => {
    const registro = stock.filter((item) => {
      if (item.id === productId && amount <= item.amount) {
        return item;
      }
    });
    return registro.length;
  };

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
      const { data } = await api.get('stock');
      stock = data;
      console.log('setou');

      if (selectedProduct) {
        if (existProductInCart(productId)) {
          const updatedCart = cart.map((item) => {
            if (item.id === productId) {
              if (checkAvaliableStock(productId, item.amount + 1)) {
                item.amount += 1;
              } else {
                toast.error('Quantidade solicitada fora de estoque');
              }
            }
            return item;
          });
          setCart([...updatedCart]);
          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify([...updatedCart])
          );
        } else {
          if (checkAvaliableStock(productId, selectedProduct.amount + 1)) {
            selectedProduct.amount += 1;
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
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
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
      const { data } = await api.get('stock');
      stock = data;

      if (existProductInCart(productId)) {
        const updatedCart = cart.map((item) => {
          if (item.id === productId) {
            if (checkAvaliableStock(productId, amount)) {
              item.amount = amount;
            } else {
              toast.error('Quantidade solicitada fora de estoque');
            }
          }
          return item;
        });
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
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
