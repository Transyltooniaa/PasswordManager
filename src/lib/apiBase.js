// Central API base resolver for browser and Dockerized environments
// Priority: Vite env -> relative path (nginx proxy) -> localhost dev
export const API_BASE = import.meta.env.VITE_API_BASE || '/';

export function api(path) {
  // If API_BASE is '/', use relative path like '/api/...'
  if (!API_BASE || API_BASE === '/') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  // Otherwise, prefix with absolute base
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
