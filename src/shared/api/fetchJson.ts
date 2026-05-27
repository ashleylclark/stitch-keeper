export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  allowEmpty = false,
) {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message
        ? `${message} (${response.status})`
        : `Request failed with status ${response.status}`,
    );
  }

  if (allowEmpty || response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
