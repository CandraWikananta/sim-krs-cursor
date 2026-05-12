export type ApiResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export function getBaseUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000";
  return u.replace(/\/$/, "");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<ApiResult<T>> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers,
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    /* empty */
  }
  const success = Boolean(json.success);
  const message =
    typeof json.message === "string" ? json.message : res.statusText;
  if (!res.ok && json.success === undefined) {
    return { success: false, message };
  }
  return {
    success,
    data: json.data as T | undefined,
    message,
  };
}
