import axios from "axios";

const TOKEN_KEY = "tuliwamu.tokens";

function readTokens() {
  try {
    return JSON.parse(sessionStorage.getItem(TOKEN_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens) {
  try {
    if (tokens) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked: the session simply won't survive a reload.
  }
}

export function hasTokens() {
  return Boolean(readTokens()?.access);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

api.interceptors.request.use((config) => {
  const tokens = readTokens();
  if (tokens?.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

let onSessionExpired = () => {};
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const tokens = readTokens();
    if (error.response?.status === 401 && tokens?.refresh && !original._retried) {
      original._retried = true;
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/token/refresh/`,
          { refresh: tokens.refresh }
        );
        saveTokens({ ...tokens, access: data.access });
        return api(original);
      } catch {
        saveTokens(null);
        onSessionExpired();
      }
    }
    return Promise.reject(error);
  }
);

/** Turn a DRF error response into one readable sentence. */
export function errorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || "Something went wrong. Is the backend running?";
  if (typeof data === "string") return "Server error. Check the backend logs.";
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(" ") : String(messages);
      return field === "non_field_errors" ? text : `${field.replaceAll("_", " ")}: ${text}`;
    })
    .join(" · ");
}

export default api;
