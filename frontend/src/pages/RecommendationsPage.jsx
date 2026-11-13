import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { recommendationsApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import ProductCard from '../components/ProductCard'

export default function RecommendationsPage() {
  const { username } = useAuth()
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [elapsed, setElapsed] = useState(null)
  const [wasCached, setWasCached] = useState(false)

  const fetchRecs = useCallback(() => {
    setLoading(true)
    const start = Date.now()
    recommendationsApi
      .get(10)
      .then(res => {
        const ms = Date.now() - start
        setRecs(res.data)
        setElapsed(ms)
        setWasCached(ms < 50)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchRecs() }, [fetchRecs])

  return (
    <div className="container">
      <div className="recs-banner">
        <div className="recs-banner-icon">✨</div>
        <div>
          <div className="recs-banner-title">Recommended for {username}</div>
          <div className="recs-banner-sub">
            Powered by item-based collaborative filtering · Cached in Redis for 1 hour
          </div>
        </div>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Your Picks</h1>
            {!loading && elapsed !== null && (
              <p className="page-subtitle">
                {recs.length} recommendation{recs.length !== 1 ? 's' : ''} · {elapsed}ms
                {wasCached
                  ? <span style={{ color: 'var(--success)', marginLeft: 8 }}>⚡ Served from cache</span>
                  : <span style={{ color: 'var(--warning)', marginLeft: 8 }}>🔄 Freshly computed</span>
                }
              </p>
            )}
          </div>
          <button
            className="btn btn-secondary"
            onClick={fetchRecs}
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Computing recommendations…
        </div>
      ) : recs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">No recommendations yet</div>
          <p style={{ marginTop: 8, fontSize: '.9rem' }}>
            <Link to="/" style={{ color: 'var(--primary)' }}>Browse products</Link>
            {' '}and interact with them (view, rate, cart, purchase) to get personalized picks.
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {recs.map(product => (
            <ProductCard key={product.id} product={product} showActions={false} />
          ))}
        </div>
      )}
    </div>
  )
}
