import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "./api";

/** GET a URL and keep {data, loading, error, reload}. Pass null to skip.
 * `loading` is only true for the first load of a URL, so tables don't
 * flicker when they refresh. */
export default function useApi(url, initial = null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ url: null, data: initial, error: "" });

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    api
      .get(url)
      .then((response) => {
        if (!cancelled) setResult({ url, data: response.data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setResult((prev) => ({ url, data: prev.data, error: errorMessage(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: result.data,
    loading: Boolean(url) && result.url !== url,
    error: result.error,
    reload,
  };
}
