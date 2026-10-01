export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
            errorData?.detail || `API request failed with status ${response.status}`
        );
    }

    return response.json();
}
