import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login:    (username, password) => http.post('/auth/login', { username, password }),
  register: (data)               => http.post('/auth/register', data),
  logout:   ()                   => http.post('/auth/logout'),
}

export const productsApi = {
  getAll:    (category)        => http.get('/products', { params: category ? { category } : {} }),
  getOne:    (id)              => http.get(`/products/${id}`),
  search:    (q, category)     => http.get('/products/search', { params: { q, ...(category ? { category } : {}) } }),
  popular:   (limit = 10)      => http.get('/products/popular', { params: { limit } }),
  create:    (data)            => http.post('/products', data),
  update:    (id, data)        => http.put(`/products/${id}`, data),
  delete:    (id)              => http.delete(`/products/${id}`),
}

export const recommendationsApi = {
  get:     (limit = 10)      => http.get('/recommendations', { params: { limit } }),
  similar: (productId, limit = 6) => http.get(`/recommendations/similar/${productId}`, { params: { limit } }),
}

export const interactionsApi = {
  record:     (productId, type, rating) =>
    http.post('/interactions', { productId, type, ...(rating != null ? { rating } : {}) }),
  getHistory: () => http.get('/interactions/history'),
}

export const usersApi = {
  me:     ()          => http.get('/users/me'),
  getOne: (id)        => http.get(`/users/${id}`),
  update: (id, data)  => http.put(`/users/${id}`, data),
}

export const analyticsApi = {
  overview:        ()            => http.get('/analytics/overview'),
  popularProducts: (limit = 10)  => http.get('/analytics/popular-products', { params: { limit } }),
}

export const adminApi = {
  getUsers:        ()                               => http.get('/admin/users'),
  deleteUser:      (id)                             => http.delete(`/admin/users/${id}`),
  seed:            (users, interactionsPerUser)      => http.post('/admin/seed', null, { params: { users, interactionsPerUser } }),
  seedCleanup:     ()                               => http.delete('/admin/seed/cleanup'),
}
