import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { recommendationsApi } from '../api'
import RecommendationCard from '../components/RecommendationCard'
import SkeletonCard from '../components/SkeletonCard'
import { Sparkles, RefreshCw, Filter, TrendingUp, Users, Info } from 'lucide-react'

const SORTS = [
  { value: 'score',  label: 'Relevance' },
  { value: 'price',  label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
]

export default function RecommendationsPage() {
  const { username } = useAuth()
  const [recs,     setRecs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [elapsed,  setElapsed]  = useState(null)
  const [wasCached,setWasCached]= useState(false)
  const [filterCF, setFilterCF] = useState('all')
  const [sort,     setSort]     = useState('score')

  const fetchRecs = useCallback(() => {
    setLoading(true)
    const start = Date.now()
    recommendationsApi.get(20)
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

  const displayed = recs
    .filter(r => filterCF === 'all' || (filterCF === 'cf' ? r.fromCollaborativeFiltering : !r.fromCollaborativeFiltering))
    .sort((a, b) => {
      if (sort === 'score')  return b.score - a.score
      if (sort === 'price')  return Number(a.product.price) - Number(b.product.price)
      if (sort === '-price') return Number(b.product.price) - Number(a.product.price)
      if (sort === 'rating') return (b.product.averageRating || 0) - (a.product.averageRating || 0)
      return 0
    })

  const cfCount       = recs.filter(r => r.fromCollaborativeFiltering).length
  const fallbackCount = recs.length - cfCount

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--surface)) 0%, var(--surface) 100%)',
        border: '1px solid var(--border)', borderRadius: 20, padding: '28px 32px', marginBottom: 32,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Sparkles size={22} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
              Personalized for {username}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
            Powered by User-Based Collaborative Filtering with cosine similarity. Cached in Redis (1h TTL).
          </p>

          {!loading && elapsed !== null && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
                padding: '4px 12px', borderRadius: 20,
                background: wasCached ? '#10b98120' : '#f59e0b20',
                color: wasCached ? 'var(--success)' : 'var(--warning)', fontWeight: 600
              }}>
                {wasCached ? '⚡ Cache hit' : '🔄 Freshly computed'} · {elapsed}ms
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
                padding: '4px 12px', borderRadius: 20, background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                color: 'var(--primary)', fontWeight: 600
              }}>
                <Users size={12} /> {cfCount} collaborative · {fallbackCount} content-based
              </span>
            </div>
          )}
        </div>

        <button
          onClick={fetchRecs} disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* How it works info box */}
      <div style={{
        display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 12, marginBottom: 24,
        background: 'color-mix(in srgb, var(--primary) 5%, var(--surface))',
        border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)'
      }}>
        <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>How it works:</strong> The engine finds users with
          similar interaction patterns using cosine similarity, then ranks products they engaged with
          that you haven&apos;t seen yet. <strong style={{ color: 'var(--primary)' }}>CF</strong> badges
          indicate collaborative filtering results; content-based fallback kicks in when signal is sparse.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14 }}>
          <Filter size={14} /> Filter:
        </div>
        {[
          { v: 'all',      l: 'All' },
          { v: 'cf',       l: '👥 Collaborative' },
          { v: 'content',  l: '⭐ Content-based' },
        ].map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setFilterCF(v)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${filterCF === v ? 'var(--primary)' : 'var(--border)'}`,
              background: filterCF === v ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
              color: filterCF === v ? 'var(--primary)' : 'var(--text-muted)', fontWeight: filterCF === v ? 600 : 400
            }}
          >
            {l}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
              cursor: 'pointer', outline: 'none'
            }}
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)'
        }}>
          <Sparkles size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No recommendations yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Browse the catalog and interact with products (view, rate, cart, purchase) to get personalized picks.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
          {displayed.map((item, i) => (
            <RecommendationCard key={item.product?.id || i} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
