/**
 * Python Buildpack
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IBuildpack, BuildContext } from '../builder.ts';
import { Logger } from '../../core/utils.ts';

const logger = new Logger('PythonBuildpack');

export class PythonBuildpack implements IBuildpack {
  name = 'Python';
  version = '1.0.0';
  priority = 85;

  async detect(context: BuildContext): Promise<boolean> {
    const requirementsPath = path.join(context.sourceDir, 'requirements.txt');
    const pipfilePath = path.join(context.sourceDir, 'Pipfile');
    const pyprojectPath = path.join(context.sourceDir, 'pyproject.toml');

    return fs.existsSync(requirementsPath) ||
           fs.existsSync(pipfilePath) ||
           fs.existsSync(pyprojectPath);
  }

  async build(context: BuildContext): Promise<void> {
    logger.info('Building Python application...');

    // Determine Python version
    const pythonVersion = this.detectPythonVersion(context);
    logger.info(`Using Python ${pythonVersion}`);

    // Create virtual environment
    logger.info('Creating virtual environment...');
    await this.runCommand(context, 'python -m venv venv');

    // Install dependencies
    await this.installDependencies(context);

    // Collect static files if Django
    if (this.isDjango(context)) {
      logger.info('Collecting Django static files...');
      await this.runCommand(context, 'venv/bin/python manage.py collectstatic --noinput');
    }

    logger.info('Python build completed');
  }

  async release(context: BuildContext): Promise<{
    defaultProcess?: string;
    processes?: Record<string, string>;
  }> {
    const processes: Record<string, string> = {};

    // Detect framework and set appropriate commands
    if (this.isDjango(context)) {
      processes.web = 'venv/bin/gunicorn wsgi:application';
      processes.worker = 'venv/bin/celery -A app worker';
    } else if (this.isFlask(context)) {
      processes.web = 'venv/bin/gunicorn app:app';
    } else if (this.isFastAPI(context)) {
      processes.web = 'venv/bin/uvicorn main:app --host 0.0.0.0 --port $PORT';
    } else if (fs.existsSync(path.join(context.sourceDir, 'app.py'))) {
      processes.web = 'venv/bin/python app.py';
    }

    // Check for Procfile
    const procfilePath = path.join(context.sourceDir, 'Procfile');
    if (fs.existsSync(procfilePath)) {
      const procfile = fs.readFileSync(procfilePath, 'utf8');
      const lines = procfile.split('\n');

      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          processes[match[1]] = match[2];
        }
      }
    }

    return {
      defaultProcess: 'web',
      processes,
    };
  }

  private detectPythonVersion(context: BuildContext): string {
    const runtimePath = path.join(context.sourceDir, 'runtime.txt');

    if (fs.existsSync(runtimePath)) {
      const runtime = fs.readFileSync(runtimePath, 'utf8').trim();
      const match = runtime.match(/python-([\d.]+)/);
      if (match) {
        return match[1];
      }
    }

    return '3.11';
  }

  private async installDependencies(context: BuildContext): Promise<void> {
    logger.info('Installing dependencies...');

    const requirementsPath = path.join(context.sourceDir, 'requirements.txt');
    const pipfilePath = path.join(context.sourceDir, 'Pipfile');
    const pyprojectPath = path.join(context.sourceDir, 'pyproject.toml');

    if (fs.existsSync(pyprojectPath)) {
      await this.runCommand(context, 'venv/bin/pip install poetry && venv/bin/poetry install');
    } else if (fs.existsSync(pipfilePath)) {
      await this.runCommand(context, 'venv/bin/pip install pipenv && venv/bin/pipenv install');
    } else if (fs.existsSync(requirementsPath)) {
      await this.runCommand(context, 'venv/bin/pip install -r requirements.txt');
    }
  }

  private isDjango(context: BuildContext): boolean {
    return fs.existsSync(path.join(context.sourceDir, 'manage.py'));
  }

  private isFlask(context: BuildContext): boolean {
    const requirementsPath = path.join(context.sourceDir, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      const requirements = fs.readFileSync(requirementsPath, 'utf8');
      return requirements.includes('Flask');
    }
    return false;
  }

  private isFastAPI(context: BuildContext): boolean {
    const requirementsPath = path.join(context.sourceDir, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      const requirements = fs.readFileSync(requirementsPath, 'utf8');
      return requirements.includes('fastapi');
    }
    return false;
  }

  private async runCommand(context: BuildContext, command: string): Promise<void> {
    logger.info(`Running: ${command}`);
    // In real implementation, use child_process.exec
  }
}
