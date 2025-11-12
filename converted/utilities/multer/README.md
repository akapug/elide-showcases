# Multer - Elide Polyglot Showcase

> **One file upload middleware for ALL languages**

Handle multipart/form-data file uploads across your entire stack.

## Features

- ✅ Single and multiple file uploads
- ✅ File size limits
- ✅ File filtering
- ✅ **Polyglot**: Works in all languages

## Quick Start

```typescript
import multer from './elide-multer.ts';

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);
});
```

## Package Stats

- **npm downloads**: ~10M/week
- **Polyglot score**: 35/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
