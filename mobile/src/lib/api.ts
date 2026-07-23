import { create } from 'axios'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://my-project-server-xo9x.onrender.com/api'

const api = create({
  baseURL: API_URL,
})

/** Converts an API-relative upload path into a URI React Native can display. */
export const resolveApiAssetUrl = (assetPath?: string | null) => {
  if (!assetPath || /^https?:\/\//i.test(assetPath) || assetPath.startsWith('file:')) return assetPath || undefined
  const apiHost = API_URL.replace(/\/api\/?$/, '')
  return `${apiHost}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`
}

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token will be cleared in AuthContext
    }
    return Promise.reject(error)
  }
)

export { api }
