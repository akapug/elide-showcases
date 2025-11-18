/**
 * Hosted-Git-Info - Git Hosting Information Parser
 *
 * Core features:
 * - Git URL parsing
 * - Multiple hosting providers
 * - SSH and HTTPS URLs
 * - Shorthand notation
 * - URL generation
 * - Provider detection
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 120M+ downloads/week
 */

type GitHost = 'github' | 'gitlab' | 'bitbucket' | 'gist';

interface GitInfo {
  type: GitHost;
  user: string;
  project: string;
  committish?: string;
  auth?: string;
  default?: string;

  https(options?: { noGitPlus?: boolean; noCommittish?: boolean }): string;
  ssh(options?: { noCommittish?: boolean }): string;
  sshurl(options?: { noCommittish?: boolean }): string;
  browse(path?: string, fragment?: string): string;
  docs(): string;
  bugs(): string;
  file(path: string): string;
  shortcut(): string;
  path(): string;
  tarball(): string;
  git(): string;
  toString(): string;
}

export function fromUrl(url: string): GitInfo | null {
  if (!url) return null;

  // GitHub patterns
  const githubPatterns = [
    /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^github:([^/]+)\/([^/]+)$/,
    /^([^/]+)\/([^/]+)$/, // shorthand
  ];

  // GitLab patterns
  const gitlabPatterns = [
    /^(?:https?:\/\/)?gitlab\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^git@gitlab\.com:([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^gitlab:([^/]+)\/([^/]+)$/,
  ];

  // Bitbucket patterns
  const bitbucketPatterns = [
    /^(?:https?:\/\/)?bitbucket\.org\/([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^git@bitbucket\.org:([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^bitbucket:([^/]+)\/([^/]+)$/,
  ];

  // Try GitHub
  for (const pattern of githubPatterns) {
    const match = url.match(pattern);
    if (match) {
      return createGitInfo('github', match[1], match[2]);
    }
  }

  // Try GitLab
  for (const pattern of gitlabPatterns) {
    const match = url.match(pattern);
    if (match) {
      return createGitInfo('gitlab', match[1], match[2]);
    }
  }

  // Try Bitbucket
  for (const pattern of bitbucketPatterns) {
    const match = url.match(pattern);
    if (match) {
      return createGitInfo('bitbucket', match[1], match[2]);
    }
  }

  return null;
}

function createGitInfo(type: GitHost, user: string, project: string): GitInfo {
  const hosts = {
    github: 'github.com',
    gitlab: 'gitlab.com',
    bitbucket: 'bitbucket.org',
    gist: 'gist.github.com',
  };

  const host = hosts[type];

  return {
    type,
    user,
    project: project.replace(/\.git$/, ''),

    https(options = {}) {
      return `https://${host}/${user}/${project}`;
    },

    ssh(options = {}) {
      return `git@${host}:${user}/${project}.git`;
    },

    sshurl(options = {}) {
      return this.ssh(options);
    },

    browse(path = '', fragment = '') {
      const base = `https://${host}/${user}/${project}`;
      if (path) return `${base}/tree/master/${path}${fragment ? '#' + fragment : ''}`;
      return base;
    },

    docs() {
      return this.browse('README.md');
    },

    bugs() {
      return `https://${host}/${user}/${project}/issues`;
    },

    file(path: string) {
      return `https://${host}/${user}/${project}/blob/master/${path}`;
    },

    shortcut() {
      return `${type}:${user}/${project}`;
    },

    path() {
      return `${user}/${project}`;
    },

    tarball() {
      if (type === 'github') {
        return `https://codeload.${host}/${user}/${project}/tar.gz/master`;
      }
      return `https://${host}/${user}/${project}/archive/master.tar.gz`;
    },

    git() {
      return `git+https://${host}/${user}/${project}.git`;
    },

    toString() {
      return this.https();
    },
  };
}

if (import.meta.url.includes("hosted-git-info")) {
  console.log("🎯 Hosted-Git-Info for Elide - Git Hosting Information Parser\n");

  console.log("=== Parse GitHub URL ===");
  const github = fromUrl('https://github.com/npm/hosted-git-info');
  if (github) {
    console.log("Type:", github.type);
    console.log("User:", github.user);
    console.log("Project:", github.project);
    console.log("HTTPS:", github.https());
    console.log("SSH:", github.ssh());
    console.log("Bugs:", github.bugs());
  }

  console.log("\n=== Parse Shorthand ===");
  const shorthand = fromUrl('user/repo');
  if (shorthand) {
    console.log("Shorthand:", shorthand.shortcut());
    console.log("Browse:", shorthand.browse());
  }

  console.log("\n=== Parse SSH URL ===");
  const ssh = fromUrl('git@github.com:user/repo.git');
  if (ssh) {
    console.log("Git URL:", ssh.git());
    console.log("Tarball:", ssh.tarball());
  }

  console.log();
  console.log("✅ Use Cases: NPM tools, Repository parsing, URL generation");
  console.log("🚀 120M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default fromUrl;
