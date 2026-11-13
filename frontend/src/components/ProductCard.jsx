import { useState } from 'react'
import { interactionsApi } from '../api'

const CATEGORY_COLORS = {
  Electronics: '#3b82f6',
  Laptops: '#8b5cf6',
  Audio: '#ec4899',
  Footwear: '#f97316',
  TV: '#14b8a6',
  Gaming: '#ef4444',
}

const CATEGORY_ICONS = {
  Electronics: '📱',
  Laptops: '💻',
  Audio: '🎧',
  Footwear: '👟',
  TV: '📺',
  Gaming: '🎮',
}

function Stars({ rating }) {
  const full = Math.round(rating || 0)
  return (
    <span className="stars">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  )
}

export default function ProductCard({ product, showActions = true }) {
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const notify = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  const record = async (type, rating) => {
    if (loading) return
    setLoading(true)
    try {
      await interactionsApi.record(product.id, type, rating)
      const labels = {
        VIEW: 'Viewed',
        ADD_TO_CART: 'Added to cart',
        PURCHASE: 'Purchased!',
        RATING: `Rated ${rating}★`,
      }
      notify(labels[type] || 'Recorded!')
    } catch {
      notify('Failed to record')
    } finally {
      setLoading(false)
    }
  }

  const handleRating = (value) => {
    setSelectedRating(value)
    record('RATING', value)
  }

  const color = CATEGORY_COLORS[product.category] || '#64748b'
  const icon = CATEGORY_ICONS[product.category] || '🛒'

  return (
    <div className="product-card">
      <div
        className="product-card-header"
        style={{ background: `${color}18` }}
      >
        {icon}
      </div>

      <div className="product-card-body">
        <span
          className="product-category-badge"
          style={{ backgroundColor: color }}
        >
          {product.category}
        </span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-brand">{product.brand}</p>
        <div className="product-rating">
          <Stars rating={product.averageRating} />
          <span>
            {(product.averageRating || 0).toFixed(1)} ({product.totalRatings || 0})
          </span>
        </div>
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
      </div>

      {showActions && (
        <div className="product-card-footer">
          <div className="rating-widget">
            <span className="rating-label">Rate:</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`star-btn ${n <= (hoverRating || selectedRating) ? 'active' : ''}`}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRating(n)}
              >
                ★
              </button>
            ))}
          </div>
          <div className="action-row">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => record('VIEW')}
              disabled={loading}
            >
              👁 View
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => record('ADD_TO_CART')}
              disabled={loading}
            >
              🛒 Cart
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={() => record('PURCHASE')}
              disabled={loading}
            >
              💳 Buy
            </button>
          </div>
          {message && <span className="action-message">✓ {message}</span>}
        </div>
      )}
    </div>
  )
}
