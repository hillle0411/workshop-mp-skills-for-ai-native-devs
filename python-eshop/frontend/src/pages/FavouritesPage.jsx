import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFavourites } from '../context/FavouritesContext';

export default function FavouritesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, refreshBasket } = useAuth();
  const { removeFavourite } = useFavourites();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/favourites' } });
      return;
    }

    api
      .getFavourites()
      .then(setProducts)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  async function handleAdd(product) {
    setBusyId(product.id);
    setActionError('');
    setMessage('');
    try {
      await api.addToBasket(product.id);
      await refreshBasket();
      setMessage(`Added ${product.name} to your basket.`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(product) {
    setBusyId(product.id);
    setActionError('');
    setMessage('');
    try {
      await removeFavourite(product.id);
      setProducts((current) => current.filter((p) => p.id !== product.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-center text-slate-500">Loading favourites...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My favourites</h1>
        <p className="mt-1 text-slate-500">Products you have saved for later.</p>
      </div>

      {loadError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load your favourites: {loadError}
        </p>
      )}
      {actionError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      {/* A failed load is shown as an error above, never as an empty list. */}
      {!loadError && products.length === 0 && (
        <div className="card text-center">
          <p className="text-slate-500">No favourites yet</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">
            Browse the catalog
          </Link>
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="card flex items-center gap-4">
              <img
                src={product.picture_uri}
                alt={product.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  {product.brand_name} · {product.type_name}
                </p>
                <p className="text-lg font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm font-bold text-slate-900">${product.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleAdd(product)}
                  disabled={busyId === product.id}
                  className="btn-primary"
                >
                  Add to basket
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(product)}
                  disabled={busyId === product.id}
                  className="btn-secondary"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
