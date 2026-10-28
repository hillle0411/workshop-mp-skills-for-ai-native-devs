import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const { email, isAuthenticated } = useAuth();
  const [favouriteIds, setFavouriteIds] = useState(() => new Set());
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    // Signing out (or in as someone else) must never show the last buyer's hearts.
    setFavouriteIds(new Set());
    setLoadError('');
    if (!isAuthenticated) return undefined;

    let cancelled = false;
    api
      .getFavourites()
      .then((products) => {
        if (!cancelled) setFavouriteIds(new Set(products.map((product) => product.id)));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [email, isAuthenticated]);

  const addFavourite = useCallback(async (productId) => {
    await api.addFavourite(productId);
    setFavouriteIds((ids) => new Set(ids).add(productId));
  }, []);

  const removeFavourite = useCallback(async (productId) => {
    await api.removeFavourite(productId);
    setFavouriteIds((ids) => {
      const next = new Set(ids);
      next.delete(productId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ favouriteIds, loadError, addFavourite, removeFavourite }),
    [favouriteIds, loadError, addFavourite, removeFavourite],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error('useFavourites must be used within FavouritesProvider');
  }
  return context;
}
