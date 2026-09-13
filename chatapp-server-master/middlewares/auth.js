import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";
import { adminSecretKey } from "../app.js";
import { TryCatch } from "./error.js";
import { CHATTU_TOKEN } from "../constants/config.js";
import { User } from "../models/user.js";

// Pin the algorithm on every verify call so a token can never be accepted
// under a different/weaker algorithm (e.g. "none") than the one we sign with.
const JWT_VERIFY_OPTIONS = { algorithms: ["HS256"] };

const isAuthenticated = TryCatch((req, res, next) => {
  // 1. Try Authorization header (Bearer token) first — works cross-site
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
      req.user = decodedData._id;
      return next();
    } catch {
      return next(new ErrorHandler("Please login to access this route", 401));
    }
  }

  // 2. Fallback to cookie (for same-site / local dev)
  const token = req.cookies[CHATTU_TOKEN];
  if (!token)
    return next(new ErrorHandler("Please login to access this route", 401));

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
    req.user = decodedData._id;
    next();
  } catch {
    return next(new ErrorHandler("Please login to access this route", 401));
  }
});

const adminOnly = (req, res, next) => {
  // 1. Try Authorization header first
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { secretKey } = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
      if (secretKey === adminSecretKey) return next();
      return next(new ErrorHandler("Only Admin can access this route", 401));
    } catch {
      return next(new ErrorHandler("Only Admin can access this route", 401));
    }
  }

  // 2. Fallback to cookie
  const token = req.cookies["chattu-admin-token"];
  if (!token)
    return next(new ErrorHandler("Only Admin can access this route", 401));

  try {
    const { secretKey } = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
    if (secretKey !== adminSecretKey)
      return next(new ErrorHandler("Only Admin can access this route", 401));
    next();
  } catch {
    return next(new ErrorHandler("Only Admin can access this route", 401));
  }
};

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    // 1. Try handshake auth token (sent from frontend SocketContext)
    const handshakeToken = socket.handshake.auth?.token;
    if (handshakeToken) {
      const decodedData = jwt.verify(handshakeToken, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
      const user = await User.findById(decodedData._id);
      if (!user) return next(new ErrorHandler("Please login to access this route", 401));
      socket.user = user;
      return next();
    }

    // 2. Fallback to cookie
    const authToken = socket.request.cookies[CHATTU_TOKEN];
    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
    const user = await User.findById(decodedData._id);
    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));

    socket.user = user;
    return next();
  } catch (error) {
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};

export { isAuthenticated, adminOnly, socketAuthenticator };
