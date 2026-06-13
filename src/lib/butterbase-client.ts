// Server-side Butterbase client — import only from API routes (never from
// "use client" files). Credentials stay server-side.
import { createClient } from "@butterbase/sdk";

let _client: ReturnType<typeof createClient> | null = null;

export function getBBClient() {
  const appId  = process.env.BUTTERBASE_APP_ID;
  const apiUrl = process.env.BUTTERBASE_API_URL;
  if (!appId || !apiUrl) {
    throw new Error("BUTTERBASE_APP_ID and BUTTERBASE_API_URL must be set");
  }
  if (!_client) {
    _client = createClient({
      appId,
      apiUrl,
      anonKey: process.env.BUTTERBASE_ANON_KEY,
    });
  }
  return _client;
}

export function isBBConfigured() {
  return !!(process.env.BUTTERBASE_APP_ID && process.env.BUTTERBASE_API_URL);
}
