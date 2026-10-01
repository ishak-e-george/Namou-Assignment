export type ApiErrorBody = {
  error: { code: string; message: string; details: Record<string, unknown> };
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const payload: unknown = response.status === 204 ? undefined : await response.json();
  if (!response.ok) {
    const body = payload as ApiErrorBody | undefined;
    throw new HttpError(
      response.status,
      body?.error?.code ?? 'INTERNAL_ERROR',
      body?.error?.message ?? 'The request failed',
      body?.error?.details ?? {},
    );
  }
  return payload as T;
}
