import * as React from "react";
import { useCallback } from "react";

/**
 * Minimal async-resource hook: one status machine (loading | ready |
 * error) plus a stable refresh function, so every panel in a view can
 * load independently instead of taking the whole page down together.
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = React.useState({ status: "loading", data: null, error: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = React.useCallback(loader, deps);

  const load = useCallback(() => {
    let cancelled = false;
    setState((current) => ({ ...current, status: current.data ? "refreshing" : "loading", error: null }));
    run()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((current) => ({ status: "error", data: current.data, error: error.message }));
      });
    return () => {
      cancelled = true;
    };
  }, [run]);

  React.useEffect(() => load(), [load]);

  return {
    ...state,
    loading: state.status === "loading",
    refreshing: state.status === "refreshing",
    refresh: load,
  };
}
