require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const app = express();
app.use(cors());
app.use(express.json());

// Multer: memory storage (stream buffer to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const ALLOWED = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Videos
      'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm',
      // Audio
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ── Helper: derive Cloudinary resource_type ──────────────────────────────────
function getResourceType(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video';
  return 'raw'; // documents
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/upload
 * Body (multipart/form-data):
 *   file      – the file to upload
 *   folder    – Cloudinary folder path (optional, default: 'nimbusx/media')
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'nimbusx/media';
    const resourceType = getResourceType(req.file.mimetype);

    // Stream buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder,
          // Auto-generate a unique public_id
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    console.log(`[UPLOAD SUCCESS] ${result.public_id} (${req.file.mimetype})`);

    return res.json({
      url:          result.secure_url,
      publicId:     result.public_id,
      resourceType: result.resource_type,
      format:       result.format,
      bytes:        result.bytes,
      width:        result.width,
      height:       result.height,
      uploadedAt:   Date.now(),
    });

  } catch (err) {
    console.error('[UPLOAD ERROR]', err.message);
    // Multer file-filter rejects unsupported types
    if (err.message.startsWith('Unsupported file type')) {
      return res.status(415).json({ error: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 50 MB)' });
    }
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * DELETE /api/media/:publicId
 * Query params:
 *   resourceType – 'image' | 'video' | 'raw' (default: 'image')
 *
 * publicId must be URL-encoded (encode '/' as '%2F')
 */
app.delete('/api/media/:publicId', async (req, res) => {
  try {
    const publicId       = decodeURIComponent(req.params.publicId);
    const resourceType   = req.query.resourceType || 'image';

    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === 'not found') {
      // Already deleted or wrong publicId — treat as success
      return res.json({ result: 'ok', note: 'Asset not found, already deleted' });
    }

    return res.json({ result: result.result });
  } catch (err) {
    console.error('[DELETE ERROR]', err.message);
    return res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅  NimbusX backend running on http://localhost:${PORT}`);
  console.log(`   Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
});
