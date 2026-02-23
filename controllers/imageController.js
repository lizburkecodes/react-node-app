const asyncHandler = require("express-async-handler");
const axios = require("axios");
const { AppError } = require('../utils/appError');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

function buildQuery(name) {
  const q = String(name || "").trim();
  if (!q) return "";
  return `${q} product photo`;
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

  const response = await axios.get("https://api.pexels.com/v1/search", {
    headers: { Authorization: PEXELS_API_KEY },
    params: {
      query,
      per_page: PER_PAGE,
      orientation: "square",
      size: "medium",
      locale: "en-US",
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

module.exports = { suggestImage };