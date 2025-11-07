/**
 * Example: File Upload Server
 * Demonstrates file upload, streaming, and static file serving
 */

import { createApp } from '../../core/app';
import { logger } from '../../middleware/logger';
import { cors } from '../../middleware/cors';
import { join } from 'path';

const UPLOAD_DIR = '/tmp/velocity-uploads';

// Create upload directory
await Bun.write(join(UPLOAD_DIR, '.gitkeep'), '');

// Create app
const app = createApp();

// Middleware
app.use(logger({ format: 'detailed' }));
app.use(cors());

// Home page
app.get('/', (ctx) => {
  return ctx.htmlResponse(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velocity File Upload</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 600px;
      padding: 40px;
    }
    h1 {
      color: #2d3748;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #718096;
      margin-bottom: 30px;
    }
    .upload-area {
      border: 3px dashed #cbd5e0;
      border-radius: 10px;
      padding: 40px;
      text-align: center;
      transition: all 0.3s;
      cursor: pointer;
    }
    .upload-area:hover {
      border-color: #667eea;
      background: #f7fafc;
    }
    .upload-area.dragover {
      border-color: #667eea;
      background: #edf2f7;
    }
    .upload-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    input[type="file"] {
      display: none;
    }
    button {
      width: 100%;
      padding: 15px;
      margin-top: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .files-list {
      margin-top: 30px;
    }
    .file-item {
      background: #f7fafc;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .file-name {
      font-weight: 600;
      color: #2d3748;
    }
    .file-size {
      color: #718096;
      font-size: 14px;
    }
    .progress {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      margin-top: 20px;
      overflow: hidden;
      display: none;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 0%;
      transition: width 0.3s;
    }
    .message {
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
      display: none;
    }
    .message.success {
      background: #c6f6d5;
      color: #22543d;
    }
    .message.error {
      background: #fed7d7;
      color: #742a2a;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ Velocity File Upload</h1>
    <p class="subtitle">Upload files with streaming support</p>

    <div class="upload-area" id="uploadArea">
      <div class="upload-icon">📁</div>
      <p><strong>Click to select files</strong> or drag and drop here</p>
      <p style="color: #718096; font-size: 14px; margin-top: 10px;">
        Maximum file size: 100MB
      </p>
    </div>

    <input type="file" id="fileInput" multiple>

    <div class="progress" id="progress">
      <div class="progress-bar" id="progressBar"></div>
    </div>

    <button id="uploadBtn" disabled>Upload Files</button>

    <div class="message" id="message"></div>

    <div class="files-list" id="filesList"></div>
  </div>

  <script>
    let selectedFiles = [];

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const message = document.getElementById('message');

    uploadArea.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      selectedFiles = Array.from(e.target.files);
      updateFilesList();
      uploadBtn.disabled = selectedFiles.length === 0;
    };

    uploadArea.ondragover = (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    };

    uploadArea.ondragleave = () => {
      uploadArea.classList.remove('dragover');
    };

    uploadArea.ondrop = (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      selectedFiles = Array.from(e.dataTransfer.files);
      updateFilesList();
      uploadBtn.disabled = selectedFiles.length === 0;
    };

    function updateFilesList() {
      const filesList = document.getElementById('filesList');
      if (selectedFiles.length === 0) {
        filesList.innerHTML = '';
        return;
      }

      filesList.innerHTML = '<h3 style="margin-bottom: 15px;">Selected Files</h3>';
      selectedFiles.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = \`
          <div>
            <div class="file-name">\${file.name}</div>
            <div class="file-size">\${formatSize(file.size)}</div>
          </div>
        \`;
        filesList.appendChild(div);
      });
    }

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function showMessage(text, type) {
      message.textContent = text;
      message.className = 'message ' + type;
      message.style.display = 'block';
      setTimeout(() => {
        message.style.display = 'none';
      }, 5000);
    }

    uploadBtn.onclick = async () => {
      if (selectedFiles.length === 0) return;

      uploadBtn.disabled = true;
      progress.style.display = 'block';

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          progressBar.style.width = ((i + 1) / selectedFiles.length * 100) + '%';
        } catch (error) {
          showMessage('Upload failed: ' + error.message, 'error');
          uploadBtn.disabled = false;
          return;
        }
      }

      showMessage('All files uploaded successfully!', 'success');
      selectedFiles = [];
      fileInput.value = '';
      updateFilesList();
      uploadBtn.disabled = true;
      progressBar.style.width = '0%';

      setTimeout(() => {
        progress.style.display = 'none';
      }, 1000);

      loadUploadedFiles();
    };

    async function loadUploadedFiles() {
      // This would load the list of uploaded files
      // Implementation depends on your backend
    }
  </script>
</body>
</html>
  `);
});

// Upload endpoint
app.post('/api/upload', async (ctx) => {
  try {
    const formData = await ctx.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return ctx.status(400).jsonResponse({ error: 'No file provided' });
    }

    // Check file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return ctx.status(400).jsonResponse({ error: 'File too large (max 100MB)' });
    }

    // Save file
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(UPLOAD_DIR, filename);

    await Bun.write(filepath, file);

    return ctx.status(201).jsonResponse({
      message: 'File uploaded successfully',
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return ctx.status(500).jsonResponse({
      error: 'Upload failed',
      message: (error as Error).message,
    });
  }
});

// List uploaded files
app.get('/api/files', async (ctx) => {
  try {
    const dir = await Array.fromAsync(
      new Bun.Glob('*').scan({ cwd: UPLOAD_DIR })
    );

    const files = await Promise.all(
      dir
        .filter(name => name !== '.gitkeep')
        .map(async (name) => {
          const file = Bun.file(join(UPLOAD_DIR, name));
          return {
            name,
            size: file.size,
            type: file.type,
          };
        })
    );

    return ctx.jsonResponse({ files });
  } catch (error) {
    return ctx.status(500).jsonResponse({
      error: 'Failed to list files',
      message: (error as Error).message,
    });
  }
});

// Download file
app.get('/api/files/:filename', async (ctx) => {
  const filename = ctx.param('filename');
  const filepath = join(UPLOAD_DIR, filename!);

  try {
    const file = Bun.file(filepath);
    const exists = await file.exists();

    if (!exists) {
      return ctx.status(404).jsonResponse({ error: 'File not found' });
    }

    return ctx.fileResponse(file, filename);
  } catch (error) {
    return ctx.status(500).jsonResponse({
      error: 'Failed to download file',
      message: (error as Error).message,
    });
  }
});

// Delete file
app.delete('/api/files/:filename', async (ctx) => {
  const filename = ctx.param('filename');
  const filepath = join(UPLOAD_DIR, filename!);

  try {
    const file = Bun.file(filepath);
    const exists = await file.exists();

    if (!exists) {
      return ctx.status(404).jsonResponse({ error: 'File not found' });
    }

    await Bun.write(filepath, '');
    // Note: Bun doesn't have a delete API, so we overwrite with empty content

    return ctx.status(204).textResponse('');
  } catch (error) {
    return ctx.status(500).jsonResponse({
      error: 'Failed to delete file',
      message: (error as Error).message,
    });
  }
});

// Streaming example
app.get('/api/stream', (ctx) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        const data = JSON.stringify({
          index: i,
          timestamp: new Date().toISOString(),
          message: `Chunk ${i + 1}`,
        }) + '\n';

        controller.enqueue(new TextEncoder().encode(data));
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      controller.close();
    },
  });

  return ctx.streamResponse(stream, 'application/x-ndjson');
});

// Start server
const PORT = parseInt(process.env.PORT || '3000');
app.listen({ port: PORT });

console.log(`\n✨ File Upload Example running at http://localhost:${PORT}`);
console.log('\nAvailable endpoints:');
console.log('  POST   /api/upload          - Upload file');
console.log('  GET    /api/files           - List uploaded files');
console.log('  GET    /api/files/:filename - Download file');
console.log('  DELETE /api/files/:filename - Delete file');
console.log('  GET    /api/stream          - Streaming example\n');
console.log(`Uploads directory: ${UPLOAD_DIR}\n`);
