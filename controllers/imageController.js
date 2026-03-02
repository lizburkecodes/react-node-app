const asyncHandler = require("express-async-handler");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { AppError } = require('../utils/appError');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// ============================================================================
// MULTER - FILE UPLOAD CONFIGURATION
// ============================================================================

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (JPEG, PNG, GIF, WebP)', 400, 'FILE_001', true), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

function buildQuery(name) {
  const q = String(name || "").trim();
  if (!q) return "";
  return q;
}

// Optional: simple shuffle so you don't always get the same first image
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const suggestImage = asyncHandler(async (req, res) => {
  const raw = req.query.query;
  const query = buildQuery(raw);

  if (!PEXELS_API_KEY) {
    throw new AppError('Image suggestion service is unavailable', 500, 'CONFIG_002', false);
  }
  if (!query) {
    throw AppError.INVALID_SEARCH_QUERY('Search query is required');
  }

  const PER_PAGE = 12;
  const randomPage = Math.floor(Math.random() * 5) + 1; // Random page 1-5 for variety

  const response = await axios.get("https://api.pexels.com/v1/search", {
    headers: { Authorization: PEXELS_API_KEY },
    params: {
      query,
      page: randomPage,
      per_page: PER_PAGE,
    },
  });

  const photos = response.data?.photos || [];

  if (photos.length === 0) {
    return res.status(200).json({ results: [] });
  }

  // Map to a simplified structure your frontend can render easily
  const results = photos
    .map((p) => ({
      imageUrl: p.src?.large || p.src?.medium || p.src?.original,
      source: "pexels",
      creditText: `Photo by ${p.photographer} on Pexels`,
      creditUrl: p.url,
      // id: p.id,
      // photographer: p.photographer,
      // photographerUrl: p.photographer_url,
    }))
    .filter((r) => Boolean(r.imageUrl)); // guard in case any src is missing

  const shuffled = shuffleArray(results);

  // Return both the array and a default suggestion (first in shuffled list)
  res.status(200).json({
    results: shuffled,
    imageUrl: shuffled[0]?.imageUrl || null,
  });
});

// ============================================================================
// UPLOAD IMAGE
// ============================================================================

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400, 'FILE_003', true);
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.status(200).json({ imageUrl });
});

module.exports = { suggestImage, upload, uploadImage };