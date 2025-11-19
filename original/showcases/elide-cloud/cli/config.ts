/**
 * Config Manager for Elide Cloud CLI
 */

import * as fs from 'fs';
import * as path from 'path';

interface Config {
  token?: string;
  user?: any;
  defaultApp?: string;
  apiUrl?: string;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    this.configPath = path.join(home, '.elide-cloud', 'config.json');
    this.config = this.load();
  }

  private load(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      // Ignore errors, return empty config
    }
    return {};
  }

  private save(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.warn('Failed to save config:', error);
    }
  }

  getToken(): string | undefined {
    return this.config.token;
  }

  setToken(token: string): void {
    this.config.token = token;
    this.save();
  }

  clearToken(): void {
    delete this.config.token;
    this.save();
  }

  getUser(): any {
    return this.config.user;
  }

  setUser(user: any): void {
    this.config.user = user;
    this.save();
  }

  clearUser(): void {
    delete this.config.user;
    this.save();
  }

  getDefaultApp(): string | undefined {
    return this.config.defaultApp;
  }

  setDefaultApp(appId: string): void {
    this.config.defaultApp = appId;
    this.save();
  }

  getApiUrl(): string {
    return this.config.apiUrl || 'http://localhost:3000';
  }

  setApiUrl(url: string): void {
    this.config.apiUrl = url;
    this.save();
  }
}
