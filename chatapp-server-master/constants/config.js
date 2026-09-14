const corsOptions = {
  origin: (origin, callback) => {
    const configuredOrigins = (process.env.CLIENT_URL || "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:8080",
      ...configuredOrigins,
    ];

    // Allow requests with no origin (mobile apps, curl, Postman, health monitors)
    if (!origin) return callback(null, true);

    // Exact match or Vercel preview branch match if configured
    const isAllowed =
      allowedOrigins.includes(origin) ||
      (process.env.ALLOW_VERCEL_PREVIEWS === "true" &&
        origin.endsWith(".vercel.app"));

    if (isAllowed) {
      callback(null, true);
    } else {
      const err = new Error(`CORS: origin ${origin} not allowed`);
      err.statusCode = 403;
      callback(err);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

const CHATTU_TOKEN = "chattu-token";

export { corsOptions, CHATTU_TOKEN };
