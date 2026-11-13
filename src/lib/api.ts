import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://api.hoopi.ai';
const API = `${API_BASE_URL}/api/v1`;
const TOKEN_KEY = 'hoopi_access_token';
const WORKSPACE_KEY = 'hoopi_workspace_id';

export type User = { id: number; email: string; full_name: string | null; is_active: boolean; is_superuser: boolean; default_llm_model?: string | null };
export type Workspace = { id: number; name: string; description?: string | null; is_personal?: boolean; role?: string };
export type Conversation = { id: string; title: string; updated_at?: string; created_at?: string };
export type FileItem = { name: string; blob_path: string; size: number; type: 'uploaded' | 'generated'; updated?: string | null; content_type: string };
export type KnowledgeUpload = { id: number; file_name: string; file_size: number; status: 'uploaded' | 'indexing' | 'completed' | 'failed'; error_message?: string | null; created_at: string };
export type OutputItem = { id: number; prompt: string; result_summary?: string | null; status: string; error?: string | null; created_at: string; completed_at?: string | null };

export const tokenStore = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export async function setWorkspace(id: number | null) {
  if (id === null) return SecureStore.deleteItemAsync(WORKSPACE_KEY);
  return SecureStore.setItemAsync(WORKSPACE_KEY, String(id));
}
export async function getWorkspaceId() {
  const raw = await SecureStore.getItemAsync(WORKSPACE_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}

let refreshInFlight: Promise<boolean> | null = null;
let sessionExpiredHandler: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}
async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', credentials: 'include' })
      .then(async response => {
        if (!response.ok) return false;
        const body = await response.json() as { access_token?: string };
        if (!body.access_token) return false;
        await tokenStore.set(body.access_token);
        return true;
      }).catch(() => false).finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const perform = async () => {
    const token = await tokenStore.get();
    const workspaceId = await getWorkspaceId();
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (workspaceId) headers.set('X-Workspace-Id', String(workspaceId));
    try { headers.set('X-Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { /* optional */ }
    return fetch(`${API}${path}`, { ...init, headers, credentials: 'include' });
  };
  let response = await perform();
  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    if (await refreshAccessToken()) response = await perform();
    else { await tokenStore.clear(); await setWorkspace(null); sessionExpiredHandler?.(); }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : detail?.message ?? body?.message ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  async login(email: string, password: string) {
    const result = await api<{ access_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    await tokenStore.set(result.access_token);
    return api<User>('/auth/profile');
  },
  profile: () => api<User>('/auth/profile'),
  register: (email: string, password: string, full_name: string) => api<User>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name }) }),
  async logout() {
    try { await api('/auth/logout', { method: 'POST', body: '{}' }); } finally { await tokenStore.clear(); await setWorkspace(null); }
  },
};

export const workspacesApi = {
  list: () => api<Workspace[]>('/workspaces'),
  home: () => api<Record<string, unknown>>('/workspaces/home'),
};
export const conversationsApi = {
  list: () => api<{ conversations: Conversation[]; total: number }>('/conversations?limit=40'),
  get: (id: string) => api<{ conversation: Conversation & { thread_key: string }; messages: { id: number; role: string; content: string }[] }>(`/conversations/${id}`),
};
export const filesApi = {
  list: () => api<FileItem[]>('/files?type=all'),
  uploadUrl: (filename: string, contentType?: string) => api<{ upload_url: string; blob_path: string }>('/files/upload-url', { method: 'POST', body: JSON.stringify({ filename, content_type: contentType }) }),
  downloadUrl: (blobPath: string) => api<{ download_url: string }>('/files/download-url', { method: 'POST', body: JSON.stringify({ blob_path: blobPath }) }),
  async upload(uri: string, filename: string, contentType?: string) {
    const signed = await this.uploadUrl(filename, contentType);
    const source = await fetch(uri); const blob = await source.blob();
    const result = await fetch(signed.upload_url, { method: 'PUT', headers: { 'Content-Type': contentType || 'application/octet-stream' }, body: blob });
    if (!result.ok) throw new Error(`File upload failed (${result.status})`);
    return signed;
  },
};
export const outputsApi = { list: () => api<{ runs: OutputItem[]; total: number }>('/agent-runs?limit=50') };
export const knowledgeApi = {
  list: () => api<{ uploads: KnowledgeUpload[]; count: number }>('/knowledge/uploads'),
  async upload(uri: string, name: string, mimeType?: string) {
    const form = new FormData();
    form.append('files', { uri, name, type: mimeType || 'application/octet-stream' } as unknown as Blob);
    return api<{ uploads?: KnowledgeUpload[]; count: number }>('/knowledge/upload-batch', { method: 'POST', body: form });
  },
};

export async function streamChat(payload: { message: string; conversation_id?: string; mode: 'chat' | 'work' }, onEvent: (event: Record<string, unknown>) => void) {
  const token = await tokenStore.get();
  const workspaceId = await getWorkspaceId();
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'text/event-stream' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (workspaceId) headers.set('X-Workspace-Id', String(workspaceId));
  try { headers.set('X-Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { /* optional */ }
  const request = () => fetch(`${API}/agent/chat/stream`, { method: 'POST', headers, body: JSON.stringify(payload), credentials: 'include' });
  let response = await request();
  if (response.status === 401 && await refreshAccessToken()) {
    const renewed = await tokenStore.get();
    if (renewed) headers.set('Authorization', `Bearer ${renewed}`);
    response = await request();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : detail?.message ?? `Chat failed (${response.status})`);
  }
  if (!response.body) throw new Error('Streaming is not available on this device.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
    for (const line of lines) if (line.startsWith('data: ')) {
      try { onEvent(JSON.parse(line.slice(6))); } catch { /* ignore malformed event */ }
    }
  }
}
