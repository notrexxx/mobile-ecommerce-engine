import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // <-- Import Auth Context

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  image_url?: string;
  category: string;
  description: string;
  stock: number;
}

// ⚠️ ARCHITECTURAL UPGRADE: 
// Explicitly exposing 'id' at the root level of CartItem so standard mapping 
// loops (like checkout transactions) can easily grab item IDs without deep nesting.
export interface CartItem {
  id: string; 
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
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Grab the currently logged-in user
  const { user } = useAuth(); 

  // Create a dynamic storage key based on whether a user exists
  const cartKey = user ? `@premium_store_cart_${user.id}` : '@premium_store_cart_guest';

  // 1. Load cart from the phone's storage whenever the user logs in or out
  useEffect(() => {
    const loadCart = async () => {
      setIsLoaded(false); // Pause saving to prevent accidental overwrites during account switch
      try {
        const storedCart = await AsyncStorage.getItem(cartKey);
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        } else {
          setCart([]); // Clear the cart array if this specific user has no saved items
        }
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadCart();
  }, [cartKey]);

  // 2. Save cart to storage whenever the cart data OR the cart key changes
  useEffect(() => {
    if (isLoaded) {
      const saveCart = async () => {
        try {
          await AsyncStorage.setItem(cartKey, JSON.stringify(cart));
        } catch (error) {
          console.error('Failed to save cart to storage:', error);
        }
      };
      saveCart();
    }
  }, [cart, isLoaded, cartKey]);

  // 3. State Watcher to verify injection in terminal
  useEffect(() => {
    if (isLoaded) { 
      console.log(`\n🛒 --- CART STATE (${user ? 'USER' : 'GUEST'}) ---`);
      console.log(`Total Unique Items: ${cart.length}`);
      console.log(`Total Quantity: ${cart.reduce((total, item) => total + item.quantity, 0)}`);
      cart.forEach(item => {
        console.log(`-> ${item.quantity}x ${item.product.name} (ID: ${item.id})`);
      });
      console.log('-------------------------------\n');
    }
  }, [cart, isLoaded, user]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        // Prevent exceeding available warehouse stock
        if (existingItem.quantity >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Provide the root-level ID when adding a brand new item
      return [...prevCart, { id: product.id, product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
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