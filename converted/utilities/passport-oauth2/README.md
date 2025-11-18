# passport-oauth2 - Elide Polyglot Showcase

> **One passport-oauth2 implementation for ALL languages**

OAuth2 authentication strategy with authorization code flow.

## 🚀 Quick Start

```typescript
import OAuth2Strategy from './elide-passport-oauth2.ts';
passport.use(new OAuth2Strategy({
  authorizationURL: 'https://provider.com/oauth2/authorize',
  tokenURL: 'https://provider.com/oauth2/token',
  clientID: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
  callbackURL: 'http://localhost:3000/auth/callback'
}, (accessToken, refreshToken, profile, done) => {
  User.findOrCreate({ oauthId: profile.id }, done);
}));
```

**npm downloads**: 3M+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
