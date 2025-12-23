'use client';

import { useState, useEffect, useCallback, useMemo, useContext, createContext } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>, addQuantity?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  isInCart: (id: string) => boolean;
  totalPrice: number;
  totalQuantity: number;
}

// Create the Cart context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Key for localStorage
const STORAGE_KEY = 'cartItems';

// Custom hook to use the Cart context
export function useCart() {
  // Get the context value
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Context provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  // Array to manage cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    setIsClient(true);
    try {
      const storedCart = localStorage.getItem(STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []); // Run once on mount

  // Save cart to localStorage when cartItems changes
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cartItems, isClient]); // Run when cartItems or isClient changes

  // Function to add an item to the cart
  const addItem = useCallback((targetProduct: Omit<CartItem, 'quantity'>, addQuantity = 1) => {
    setCartItems((prevCart) => {
      // Check if the product is already in the cart
      const isInCart = prevCart.find((item) => item.id === targetProduct.id);

      if (isInCart) {
        return prevCart.map((item) =>
          item.id === targetProduct.id ? { ...item, quantity: item.quantity + addQuantity } : item
        );
      } else {
        // If not in cart, add it with the specified quantity
        return [...prevCart, { ...targetProduct, quantity: addQuantity }];
      }
    });
  }, []);

  // Function to remove an item from the cart
  const removeItem = useCallback((targetId: string) => {
    setCartItems(prevCart => prevCart.filter(p => p.id !== targetId));
  }, []);

  // Function to clear the cart
  const clearCart = useCallback(() => {
    setCartItems([]);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing cart from localStorage:', error);
      }
    }
  }, []);

  // Function to update the quantity of an item in the cart
  const updateQuantity = useCallback((targetId: string, newQuantity: number) => {
    // Cart array
    setCartItems((prevCart) => {
      if (newQuantity > 0) { // Update only if quantity is greater than 0
        return prevCart.map((item) =>
          item.id === targetId ? { ...item, quantity: newQuantity } : item
        );
      } else { // If quantity is 0 or less, remove the item
        return prevCart.filter(item => item.id !== targetId);
      }
    });
  }, []);

  // Check if a product with the specified ID is in the cart
  const isInCart = useCallback((targetId: string) => {
    return cartItems.some(p => p.id === targetId);
  }, [cartItems]);

  // Total price of items in the cart
  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  // Total quantity of items in the cart
  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Context value to be passed to provider
  const value = useMemo(() => ({
    cartItems: isClient ? cartItems : [],
    addItem,
    removeItem,
    clearCart,
    updateQuantity,
    isInCart,
    totalPrice: isClient ? totalPrice : 0,
    totalQuantity: isClient ? totalQuantity : 0,
  }), [
    isClient, cartItems, addItem, removeItem, clearCart, updateQuantity, isInCart, totalPrice, totalQuantity
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}