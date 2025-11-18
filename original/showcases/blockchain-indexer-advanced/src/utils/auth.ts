const API_KEYS: Record<string, { role: string; permissions: string[] }> = {
  'admin_key_123': { role: 'admin', permissions: ['read', 'write', 'admin'] },
  'readonly_key_456': { role: 'readonly', permissions: ['read'] },
};

export function validateApiKey(apiKey: string, requiredRole?: string): boolean {
  const keyData = API_KEYS[apiKey];

  if (!keyData) {
    return false;
  }

  if (requiredRole && keyData.role !== requiredRole) {
    return false;
  }

  return true;
}

export function hasPermission(apiKey: string, permission: string): boolean {
  const keyData = API_KEYS[apiKey];
  return keyData ? keyData.permissions.includes(permission) : false;
}
