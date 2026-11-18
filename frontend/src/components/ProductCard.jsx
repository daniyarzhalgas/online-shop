import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { interactionsApi } from '../api'
import { useGlobalToast } from '../App'
import { ShoppingCart, Eye, CreditCard, Star, ExternalLink } from 'lucide-react'

const CATEGORY_COLORS = {
  Electronics: '#3b82f6',
  Laptops:     '#8b5cf6',
  Audio:       '#ec4899',
  Footwear:    '#f97316',
  TV:          '#14b8a6',
  Gaming:      '#ef4444',
}

const CATEGORY_ICONS = {
  Electronics: '📱',
  Laptops:     '💻',
  Audio:       '🎧',
  Footwear:    '👟',
  TV:          '📺',
  Gaming:      '🎮',
}

function StarRow({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          size={size}
          style={{ color: n <= Math.round(rating || 0) ? '#f59e0b' : 'var(--border)' }}
          fill={n <= Math.round(rating || 0) ? '#f59e0b' : 'none'}
        />
      ))}
    </span>
  )
}

export default function ProductCard({ product, showActions = true, compact = false }) {
  const toast = useGlobalToast()
  const navigate = useNavigate()
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [loading, setLoading] = useState(false)

  const color = CATEGORY_COLORS[product.category] || '#64748b'
  const icon  = CATEGORY_ICONS[product.category]  || '🛒'

  const record = async (type, rating) => {
    if (loading) return
    setLoading(true)
    try {
      await interactionsApi.record(product.id, type, rating)
      const labels = { VIEW: 'Viewed', ADD_TO_CART: 'Added to cart', PURCHASE: 'Purchased!', RATING: `Rated ${rating}★` }
      toast?.(labels[type] || 'Recorded!', 'success')
    } catch {
      toast?.('Failed to record interaction', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="card-hover"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header band */}
      <div
        style={{
          height: compact ? 60 : 80,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `2px solid ${color}30`
        }}
      >
        <span style={{ fontSize: compact ? 24 : 32 }}>{icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
          color, background: `${color}20`, padding: '3px 8px', borderRadius: 20
        }}>
          {product.category}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: compact ? '12px' : '16px', flex: 1 }}>
        <h3
          onClick={() => navigate(`/products/${product.id}`)}
          style={{
            fontSize: compact ? 13 : 15, fontWeight: 600, color: 'var(--text)',
            cursor: 'pointer', marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {product.name}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{product.brand}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: compact ? 8 : 12 }}>
          <StarRow rating={product.averageRating} size={12} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {(product.averageRating || 0).toFixed(1)} ({product.totalRatings || 0})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: compact ? 15 : 18, fontWeight: 700, color: 'var(--primary)' }}>
            ${Number(product.price).toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: product.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>

      {showActions && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {/* Star rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Rate:</span>
            {[1,2,3,4,5].map(n => (
              <Star
                key={n}
                size={18}
                style={{
                  cursor: 'pointer',
                  color: n <= (hoverRating || selectedRating) ? '#f59e0b' : 'var(--border)',
                  transition: 'color 0.1s'
                }}
                fill={n <= (hoverRating || selectedRating) ? '#f59e0b' : 'none'}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => { setSelectedRating(n); record('RATING', n) }}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => record('VIEW')}
              disabled={loading}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', fontSize: 12, color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <Eye size={13} /> View
            </button>
            <button
              onClick={() => record('ADD_TO_CART')}
              disabled={loading}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid var(--primary)',
                background: 'transparent', fontSize: 12, color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <ShoppingCart size={13} /> Cart
            </button>
            <button
              onClick={() => record('PURCHASE')}
              disabled={loading}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', fontSize: 12, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <CreditCard size={13} /> Buy
            </button>
          </div>

          {/* Details link */}
          <button
            onClick={() => navigate(`/products/${product.id}`)}
            style={{
              width: '100%', padding: '7px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', fontSize: 12, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <ExternalLink size={13} /> View Details
          </button>
        </div>
      )}
    </div>
  )
}
