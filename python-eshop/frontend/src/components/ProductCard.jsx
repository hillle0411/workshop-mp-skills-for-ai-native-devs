import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFavourites } from '../context/FavouritesContext';

export default function ProductCard({ item, onAdded }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, refreshBasket } = useAuth();
  const { favouriteIds, addFavourite, removeFavourite } = useFavourites();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [savingFavourite, setSavingFavourite] = useState(false);
  const [favouriteError, setFavouriteError] = useState('');
  const isFavourite = favouriteIds.has(item.id);

  async function handleFavourite() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setSavingFavourite(true);
    setFavouriteError('');
    try {
      if (isFavourite) {
        await removeFavourite(item.id);
      } else {
        await addFavourite(item.id);
      }
    } catch (error) {
      setFavouriteError(error.message);
    } finally {
      setSavingFavourite(false);
    }
  }

  async function handleAdd() {
    setLoading(true);
    setMessage('');
    try {
      await api.addToBasket(item.id);
      await refreshBasket();
      setMessage('Added!');
      onAdded?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <button
          type="button"
          onClick={handleFavourite}
          disabled={savingFavourite}
          aria-pressed={isFavourite}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl text-rose-500 shadow transition hover:scale-110 disabled:opacity-50"
        >
          {isFavourite ? '♥' : '♡'}
        </button>
        <img
          src={item.picture_uri}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            {item.brand_name} · {item.type_name}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.name}</h3>
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">{item.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-bold text-slate-900">${item.price.toFixed(2)}</p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Adding...' : 'Add to basket'}
          </button>
        </div>
        {message && <p className="text-xs font-medium text-emerald-600">{message}</p>}
        {favouriteError && <p className="text-xs font-medium text-red-600">{favouriteError}</p>}
      </div>
    </article>
  );
}
