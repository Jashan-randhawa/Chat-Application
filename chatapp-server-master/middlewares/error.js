import { envMode } from "../app.js";

const errorMiddleware = (err, req, res, next) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  if (err.code === 11000) {
    const error = Object.keys(err.keyPattern).join(",");
    err.message = `Duplicate field - ${error}`;
    err.statusCode = 400;
  }

  if (err.name === "CastError") {
    const errorPath = err.path;
    err.message = `Invalid Format of ${errorPath}`;
    err.statusCode = 400;
  }

  // Multer's own errors (file too large, unexpected field, etc.) are
  // client mistakes, not server failures — they come with a safe,
  // already-generic message and default to no statusCode, so without this
  // they'd fall through to the 5xx branch below and get masked into an
  // unhelpful "something went wrong" instead of "File too large".
  if (err.name === "MulterError") {
    err.statusCode = 400;
  }

  // Always log the full error server-side, regardless of environment or
  // whether the client sees a generic message.
  console.error(err.stack || err);

  // Anything that reached here with a 5xx status is, by definition, a case
  // we didn't anticipate and craft a message for (unlike the 400/401/404
  // messages set deliberately above or via ErrorHandler in controllers,
  // which are already written to be safe to show a user). A raw 500 can
  // carry a driver/library error string with internal details — stack
  // fragments, file paths, connection info — so in production we swap it
  // for a generic message instead of forwarding it to the client.
  const isUnexpectedServerError = err.statusCode >= 500;
  const clientMessage =
    isUnexpectedServerError && envMode !== "DEVELOPMENT"
      ? "Something went wrong. Please try again later."
      : err.message;

  const response = {
    success: false,
    message: clientMessage,
  };

  if (envMode === "DEVELOPMENT") {
    response.error = err;
  }

  return res.status(err.statusCode).json(response);
};

const TryCatch = (passedFunc) => async (req, res, next) => {
  try {
    await passedFunc(req, res, next);
  } catch (error) {
    next(error);
  }
};

export { errorMiddleware, TryCatch };
