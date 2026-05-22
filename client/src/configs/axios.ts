import axios from 'axios'

const getBaseURL = () => {
    // For production/deployed environments
    if (import.meta.env.VITE_BASEURL) {
        return import.meta.env.VITE_BASEURL
    }
    // Default fallback for development
    return 'http://localhost:3000'
}

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
    timeout: 30000,
})

// Response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            window.location.href = '/auth/login'
        }
        return Promise.reject(error)
    }
)

export default api