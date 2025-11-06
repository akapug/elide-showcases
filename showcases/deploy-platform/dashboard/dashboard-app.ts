/**
 * Deploy Platform - Dashboard Application
 *
 * Web-based dashboard for managing deployments, projects,
 * and monitoring platform metrics.
 */

interface DashboardState {
  user: User | null;
  currentTeam: Team | null;
  projects: Project[];
  deployments: Deployment[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  teams: string[];
}

interface Team {
  id: string;
  name: string;
  slug: string;
  members: TeamMember[];
}

interface TeamMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
}

interface Project {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  framework?: string;
  repository?: string;
  branch: string;
  domains: string[];
  environmentVariables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface Deployment {
  id: string;
  projectId: string;
  status: 'queued' | 'building' | 'deploying' | 'ready' | 'error' | 'canceled';
  url: string;
  alias?: string[];
  branch: string;
  commit: string;
  commitMessage: string;
  createdAt: Date;
  buildTime?: number;
  errorMessage?: string;
}

/**
 * Dashboard Application
 */
export class DashboardApp {
  private state: DashboardState;
  private apiBaseUrl: string;
  private token: string | null = null;

  constructor(apiBaseUrl: string = 'https://api.deploy-platform.io') {
    this.apiBaseUrl = apiBaseUrl;

    this.state = {
      user: null,
      currentTeam: null,
      projects: [],
      deployments: [],
      selectedProject: null,
      loading: false,
      error: null
    };

    this.loadToken();
  }

  /**
   * Initialize dashboard
   */
  async initialize(): Promise<void> {
    if (!this.token) {
      this.renderLoginPage();
      return;
    }

    try {
      await this.loadUser();
      await this.loadProjects();
      this.renderDashboard();
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.state.error = String(error);
      this.renderError();
    }
  }

  /**
   * Login
   */
  async login(email: string, password: string): Promise<void> {
    this.state.loading = true;
    this.state.error = null;

    try {
      const response = await this.apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      this.token = response.token;
      this.saveToken(this.token);

      await this.initialize();
    } catch (error) {
      this.state.error = 'Invalid credentials';
      this.state.loading = false;
      this.renderLoginPage();
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.token = null;
    this.clearToken();
    this.renderLoginPage();
  }

  /**
   * Load user
   */
  private async loadUser(): Promise<void> {
    const user = await this.apiRequest('/auth/user');
    this.state.user = user;

    // Load teams
    const teams = await this.apiRequest('/teams');
    if (teams.length > 0) {
      this.state.currentTeam = teams[0];
    }
  }

  /**
   * Load projects
   */
  private async loadProjects(): Promise<void> {
    if (!this.state.currentTeam) return;

    const projects = await this.apiRequest(
      `/projects?teamId=${this.state.currentTeam.id}`
    );

    this.state.projects = projects;
  }

  /**
   * Load deployments
   */
  private async loadDeployments(projectId: string): Promise<void> {
    const deployments = await this.apiRequest(
      `/projects/${projectId}/deployments`
    );

    this.state.deployments = deployments;
  }

  /**
   * Select project
   */
  async selectProject(projectId: string): Promise<void> {
    const project = this.state.projects.find(p => p.id === projectId);

    if (!project) return;

    this.state.selectedProject = project;
    await this.loadDeployments(projectId);
    this.renderProjectView();
  }

  /**
   * Create project
   */
  async createProject(data: {
    name: string;
    framework?: string;
    repository?: string;
    branch?: string;
  }): Promise<void> {
    if (!this.state.currentTeam) return;

    const project = await this.apiRequest('/projects', {
      method: 'POST',
      body: {
        teamId: this.state.currentTeam.id,
        ...data
      }
    });

    this.state.projects.push(project);
    await this.selectProject(project.id);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.apiRequest(`/projects/${projectId}`, {
      method: 'DELETE'
    });

    this.state.projects = this.state.projects.filter(p => p.id !== projectId);

    if (this.state.selectedProject?.id === projectId) {
      this.state.selectedProject = null;
      this.state.deployments = [];
    }

    this.renderDashboard();
  }

  /**
   * Create deployment
   */
  async createDeployment(projectId: string): Promise<void> {
    const deployment = await this.apiRequest(
      `/projects/${projectId}/deployments`,
      {
        method: 'POST',
        body: {
          source: 'dashboard'
        }
      }
    );

    this.state.deployments.unshift(deployment);
    this.renderProjectView();

    // Poll for updates
    this.pollDeploymentStatus(deployment.id);
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(deploymentId: string): Promise<void> {
    await this.apiRequest(`/deployments/${deploymentId}/cancel`, {
      method: 'POST'
    });

    const deployment = this.state.deployments.find(d => d.id === deploymentId);
    if (deployment) {
      deployment.status = 'canceled';
      this.renderProjectView();
    }
  }

  /**
   * Promote deployment
   */
  async promoteDeployment(deploymentId: string): Promise<void> {
    await this.apiRequest(`/deployments/${deploymentId}/promote`, {
      method: 'POST'
    });

    const deployment = this.state.deployments.find(d => d.id === deploymentId);
    if (deployment) {
      // Update alias
      this.renderProjectView();
    }
  }

  /**
   * Add environment variable
   */
  async addEnvironmentVariable(
    projectId: string,
    key: string,
    value: string,
    target: string[]
  ): Promise<void> {
    await this.apiRequest(`/projects/${projectId}/env`, {
      method: 'POST',
      body: { key, value, target }
    });

    await this.loadProjects();
    this.renderProjectView();
  }

  /**
   * Delete environment variable
   */
  async deleteEnvironmentVariable(
    projectId: string,
    key: string
  ): Promise<void> {
    await this.apiRequest(`/projects/${projectId}/env/${key}`, {
      method: 'DELETE'
    });

    await this.loadProjects();
    this.renderProjectView();
  }

  /**
   * Add domain
   */
  async addDomain(projectId: string, domain: string): Promise<void> {
    await this.apiRequest(`/projects/${projectId}/domains`, {
      method: 'POST',
      body: { domain }
    });

    await this.loadProjects();
    this.renderProjectView();
  }

  /**
   * Delete domain
   */
  async deleteDomain(projectId: string, domainId: string): Promise<void> {
    await this.apiRequest(`/projects/${projectId}/domains/${domainId}`, {
      method: 'DELETE'
    });

    await this.loadProjects();
    this.renderProjectView();
  }

  /**
   * Poll deployment status
   */
  private pollDeploymentStatus(deploymentId: string): void {
    const interval = setInterval(async () => {
      try {
        const deployment = await this.apiRequest(
          `/deployments/${deploymentId}`
        );

        const index = this.state.deployments.findIndex(
          d => d.id === deploymentId
        );

        if (index !== -1) {
          this.state.deployments[index] = deployment;
          this.renderProjectView();
        }

        if (deployment.status === 'ready' || deployment.status === 'error') {
          clearInterval(interval);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 3000);
  }

  /**
   * API request helper
   */
  private async apiRequest(
    path: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Save token
   */
  private saveToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('deploy_platform_token', token);
    }
  }

  /**
   * Load token
   */
  private loadToken(): void {
    if (typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('deploy_platform_token');
    }
  }

  /**
   * Clear token
   */
  private clearToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('deploy_platform_token');
    }
  }

  /**
   * Render login page
   */
  private renderLoginPage(): void {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deploy Platform - Login</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .login-container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              width: 100%;
              max-width: 400px;
            }
            h1 { margin-bottom: 30px; color: #333; text-align: center; }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 5px; color: #555; font-weight: 500; }
            input {
              width: 100%;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 5px;
              font-size: 14px;
            }
            button {
              width: 100%;
              padding: 12px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 5px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.3s;
            }
            button:hover { background: #5568d3; }
            .error { color: #e74c3c; margin-bottom: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="login-container">
            <h1>Deploy Platform</h1>
            ${this.state.error ? `<div class="error">${this.state.error}</div>` : ''}
            <form id="login-form">
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="email" placeholder="you@example.com" required />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="********" required />
              </div>
              <button type="submit">Sign In</button>
            </form>
          </div>
        </body>
      </html>
    `;

    this.render(html);
  }

  /**
   * Render dashboard
   */
  private renderDashboard(): void {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deploy Platform - Dashboard</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #f5f7fa;
            }
            .header {
              background: white;
              border-bottom: 1px solid #e1e8ed;
              padding: 0 30px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .logo { font-size: 20px; font-weight: 700; color: #667eea; }
            .user-menu { display: flex; align-items: center; gap: 15px; }
            .sidebar {
              position: fixed;
              left: 0;
              top: 60px;
              bottom: 0;
              width: 250px;
              background: white;
              border-right: 1px solid #e1e8ed;
              padding: 20px;
            }
            .main-content {
              margin-left: 250px;
              padding: 30px;
              min-height: calc(100vh - 60px);
            }
            .project-list { list-style: none; }
            .project-item {
              padding: 12px;
              margin-bottom: 5px;
              border-radius: 5px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .project-item:hover { background: #f5f7fa; }
            .project-item.active { background: #667eea; color: white; }
            .btn {
              padding: 10px 20px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            }
            .btn:hover { background: #5568d3; }
            .btn-secondary { background: #95a5a6; }
            .btn-secondary:hover { background: #7f8c8d; }
            .card {
              background: white;
              border-radius: 10px;
              padding: 25px;
              margin-bottom: 20px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .card h2 { margin-bottom: 20px; color: #333; }
            .empty-state {
              text-align: center;
              padding: 60px 20px;
              color: #999;
            }
            .empty-state h3 { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Deploy Platform</div>
            <div class="user-menu">
              <span>${this.state.user?.name}</span>
              <button class="btn btn-secondary" onclick="logout()">Logout</button>
            </div>
          </div>
          <div class="sidebar">
            <h3 style="margin-bottom: 15px;">Projects</h3>
            <ul class="project-list">
              ${this.state.projects.map(p => `
                <li class="project-item" onclick="selectProject('${p.id}')">
                  ${p.name}
                </li>
              `).join('')}
            </ul>
            <button class="btn" style="width: 100%; margin-top: 20px;" onclick="createProject()">
              New Project
            </button>
          </div>
          <div class="main-content">
            ${this.state.projects.length === 0 ? `
              <div class="empty-state">
                <h3>No projects yet</h3>
                <p>Create your first project to get started</p>
              </div>
            ` : `
              <div class="card">
                <h2>Getting Started</h2>
                <p>Select a project from the sidebar to view deployments</p>
              </div>
            `}
          </div>
        </body>
      </html>
    `;

    this.render(html);
  }

  /**
   * Render project view
   */
  private renderProjectView(): void {
    if (!this.state.selectedProject) return;

    const project = this.state.selectedProject;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project.name} - Deploy Platform</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #f5f7fa;
            }
            .header {
              background: white;
              border-bottom: 1px solid #e1e8ed;
              padding: 0 30px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .main-content { padding: 30px; }
            .card {
              background: white;
              border-radius: 10px;
              padding: 25px;
              margin-bottom: 20px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .card h2 { margin-bottom: 20px; color: #333; }
            .deployment-list { list-style: none; }
            .deployment-item {
              padding: 15px;
              border: 1px solid #e1e8ed;
              border-radius: 5px;
              margin-bottom: 10px;
            }
            .status {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: 600;
            }
            .status-ready { background: #d4edda; color: #155724; }
            .status-building { background: #fff3cd; color: #856404; }
            .status-error { background: #f8d7da; color: #721c24; }
            .btn {
              padding: 10px 20px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              margin-right: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${project.name}</h1>
            <button class="btn" onclick="deploy()">Deploy Now</button>
          </div>
          <div class="main-content">
            <div class="card">
              <h2>Recent Deployments</h2>
              ${this.state.deployments.length === 0 ? `
                <p>No deployments yet. Click "Deploy Now" to create your first deployment.</p>
              ` : `
                <ul class="deployment-list">
                  ${this.state.deployments.map(d => `
                    <li class="deployment-item">
                      <div>
                        <span class="status status-${d.status}">${d.status}</span>
                        <strong>${d.commit.substring(0, 7)}</strong>
                        ${d.commitMessage}
                      </div>
                      <div><a href="${d.url}" target="_blank">${d.url}</a></div>
                      <div style="font-size: 12px; color: #999; margin-top: 5px;">
                        ${new Date(d.createdAt).toLocaleString()}
                        ${d.buildTime ? ` • Build time: ${d.buildTime}ms` : ''}
                      </div>
                    </li>
                  `).join('')}
                </ul>
              `}
            </div>

            <div class="card">
              <h2>Settings</h2>
              <p><strong>Framework:</strong> ${project.framework || 'Not specified'}</p>
              <p><strong>Repository:</strong> ${project.repository || 'Not specified'}</p>
              <p><strong>Branch:</strong> ${project.branch}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    this.render(html);
  }

  /**
   * Render error
   */
  private renderError(): void {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Deploy Platform</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 40px;
              text-align: center;
            }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Error</h1>
          <p class="error">${this.state.error}</p>
        </body>
      </html>
    `;

    this.render(html);
  }

  /**
   * Render HTML
   */
  private render(html: string): void {
    if (typeof document !== 'undefined') {
      document.body.innerHTML = html;
    } else {
      console.log(html);
    }
  }
}

// Export dashboard instance
export const dashboardApp = new DashboardApp();
