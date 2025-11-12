/**
 * Elide Passport - Universal Authentication Middleware
 * Simple authentication strategies
 */

export interface Strategy {
  name: string;
  authenticate: (req: any, options?: any) => Promise<any>;
}

export class Passport {
  private strategies: Map<string, Strategy> = new Map();

  use(name: string | Strategy, strategy?: Strategy) {
    if (typeof name === 'string' && strategy) {
      this.strategies.set(name, strategy);
    } else if (typeof name === 'object') {
      this.strategies.set(name.name, name);
    }
  }

  authenticate(strategyName: string, options: any = {}) {
    return async (req: any, res: any, next: () => void) => {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) {
        throw new Error(`Strategy '${strategyName}' not found`);
      }

      try {
        const user = await strategy.authenticate(req, options);
        req.user = user;
        next();
      } catch (error: any) {
        if (options.failureRedirect) {
          res.redirect?.(options.failureRedirect);
        } else {
          res.status?.(401).json?.({ error: 'Unauthorized' });
        }
      }
    };
  }

  initialize() {
    return (req: any, res: any, next: () => void) => {
      req.login = (user: any) => { req.user = user; };
      req.logout = () => { req.user = null; };
      next();
    };
  }

  session() {
    return (req: any, res: any, next: () => void) => next();
  }
}

export default new Passport();

if (import.meta.main) {
  console.log('=== Elide Passport Demo ===');
  console.log('Authentication middleware');
  console.log('Usage:');
  console.log('  passport.use(new LocalStrategy(...));');
  console.log('  app.use(passport.initialize());');
  console.log('  app.post("/login", passport.authenticate("local"));');
}
