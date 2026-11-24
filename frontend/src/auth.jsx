import { useCallback, useEffect, useState } from "react";
import api, { hasTokens, saveTokens, setSessionExpiredHandler } from "./api";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasTokens());

  const logout = useCallback(() => {
    saveTokens(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(logout);
    if (!hasTokens()) return;
    api
      .get("/api/accounts/profile/")
      .then(({ data }) => setUser(data))
      .catch(() => saveTokens(null))
      .finally(() => setLoading(false));
  }, [logout]);

  async function login(username, password) {
    const { data } = await api.post("/api/token/", { username, password });
    saveTokens({ access: data.access, refresh: data.refresh });
    const profile = await api.get("/api/accounts/profile/");
    setUser(profile.data);
    return profile.data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
