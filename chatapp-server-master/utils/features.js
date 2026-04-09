import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";

const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: process.env.NODE_ENV === "PRODUCTION" ? "none" : "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "PRODUCTION",
};

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: "Chattu" })
    .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
    .catch((err) => {
      throw err;
    });
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  return res
    .status(code)
    .cookie("chattu-token", token, cookieOptions)
    .json({
      success: true,
      user,
      token, // also send token in body for cross-site clients
      message,
    });
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (err) {
    throw new Error("Error uploading files to cloudinary", err);
  }
};

const deletFilesFromCloudinary = async (public_ids) => {
  if (!public_ids?.length) return;

  const chunkSize = 100;
  const chunks = [];

  for (let i = 0; i < public_ids.length; i += chunkSize) {
    chunks.push(public_ids.slice(i, i + chunkSize));
  }

  const resourceTypes = ["image", "raw", "video"];

  await Promise.all(
    chunks.flatMap((chunk) =>
      resourceTypes.map((resource_type) =>
        cloudinary.api.delete_resources(chunk, { resource_type })
      )
    )
  );
};

export {
  connectDB,
  sendToken,
  cookieOptions,
  emitEvent,
  deletFilesFromCloudinary,
  uploadFilesToCloudinary,
};
