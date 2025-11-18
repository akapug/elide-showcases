# Assets Directory

This directory is for sample images used in examples and tests.

## Image Requirements

For testing image embeddings:

- **Format**: JPG, PNG, or WebP
- **Size**: Any size (will be resized by CLIP)
- **Content**: Any images for testing

## Example Usage

```typescript
// Load image for embedding
const imagePath = './assets/sample-image.jpg';
const result = await fetch('http://localhost:3000/embed/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ images: [imagePath] })
});
```

## Sample Images

Place sample images here for:
- Testing multimodal search
- Benchmarking image embeddings
- Example demonstrations
- Documentation screenshots

## Notes

- Images are not included in the repository by default
- Add your own test images when running examples
- Supported formats: JPG, PNG, WebP, BMP
