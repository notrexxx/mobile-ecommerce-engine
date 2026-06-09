import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
  isLoaded: boolean; // Tells the UI when storage finishes loading
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = '@premium_store_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load initial cart from the phone's storage on startup
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadCart();
  }, []);

  // 2. Save cart to storage whenever it changes (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      const saveCart = async () => {
        try {
          await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
          console.error('Failed to save cart to storage:', error);
        }
      };
      saveCart();
    }
  }, [cart, isLoaded]);

  // 3. State Watcher to verify injection in terminal
  useEffect(() => {
    if (isLoaded) { // Only log once the cart has actually loaded from memory
      console.log('\n🛒 --- CART STATE INJECTED ---');
      console.log(`Total Unique Items: ${cart.length}`);
      console.log(`Total Quantity: ${cart.reduce((total, item) => total + item.quantity, 0)}`);
      cart.forEach(item => {
        console.log(`-> ${item.quantity}x ${item.product.name}`);
      });
      console.log('-------------------------------\n');
    }
  }, [cart, isLoaded]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        // Prevent exceeding available warehouse stock
        if (existingItem.quantity >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  const getCartTotal = () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getCartCount, getCartTotal, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}