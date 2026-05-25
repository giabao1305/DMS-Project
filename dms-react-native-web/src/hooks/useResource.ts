import { useCallback, useEffect, useState } from "react";

import { toVietnameseError } from "../utils/errorMessage";

type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

export function useResource<T>(loader: () => Promise<T>, deps: React.DependencyList = []): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không tải được dữ liệu."));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
