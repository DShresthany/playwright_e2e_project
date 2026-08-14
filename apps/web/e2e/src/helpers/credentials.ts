export function requireEnvCredentials(
    userKey: 'STANDARD_USER' | 'LOCKED_USER' | 'ADMIN_USER',
    passwordKey: 'STANDARD_PASSWORD' | 'LOCKED_PASSWORD' | 'ADMIN_PASSWORD',
  ): { username: string; password: string } {
    const username = process.env[userKey];
    const password = process.env[passwordKey];
    if (!username || !password) {
      throw new Error(`${userKey} and ${passwordKey} must be set`);
    }
    return { username, password };
  }