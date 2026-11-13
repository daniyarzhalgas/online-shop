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
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (username, password) => http.post('/auth/login', { username, password }),
  logout: () => http.post('/auth/logout'),
}

export const productsApi = {
  getAll: (category) => http.get('/products', { params: category ? { category } : {} }),
}

export const recommendationsApi = {
  get: (limit = 10) => http.get('/recommendations', { params: { limit } }),
}

export const interactionsApi = {
  record: (productId, type, rating) =>
    http.post('/interactions', { productId, type, ...(rating != null ? { rating } : {}) }),
  getHistory: () => http.get('/interactions/history'),
}
