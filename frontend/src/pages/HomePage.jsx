import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../api'
import ProductCard from '../components/ProductCard'

const CATEGORIES = ['All', 'Electronics', 'Laptops', 'Audio', 'Footwear', 'TV', 'Gaming']

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')

  useEffect(() => {
    setLoading(true)
    productsApi
      .getAll(category === 'All' ? null : category)
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Browse Products</h1>
        <p className="page-subtitle">
          Interact with products to get personalized{' '}
          <Link to="/recommendations" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            recommendations ✨
          </Link>
        </p>
      </div>

      <div className="category-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-btn${category === cat ? ' active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading products…
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No products found</div>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
