import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Ensure CSRF meta exists (set by app after fetch)
function ensureCsrfMeta() {
  let el = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  if (!el) {
    el = document.createElement('meta');
    el.name = 'csrf-token';
    el.content = '';
    document.head.appendChild(el);
  }
  return el;
}

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const csrfEl = ensureCsrfMeta();
  if (csrfEl?.content) config.headers['X-CSRF-Token'] = csrfEl.content;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(API_URL + '/api/auth/refresh', {}, { withCredentials: true });
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch (_) {
        localStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

/** Upload an image file; returns the public URL. Use when user has "proceeded" (e.g. save form). */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post<{ url?: string }>('/api/upload', formData);
  if (!data?.url) throw new Error('No URL returned');
  return data.url;
}

export default api;
