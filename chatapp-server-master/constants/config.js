const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS,
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://chat-application-ivory-one.vercel.app",
  ...configuredOrigins,
];

const corsOptions = {
  origin: [...new Set(allowedOrigins)],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

const CHATTU_TOKEN = "chattu-token";

export { corsOptions, CHATTU_TOKEN };
