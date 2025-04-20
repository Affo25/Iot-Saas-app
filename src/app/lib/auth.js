// lib/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const mockUser = {
  username: "admin",
  passwordHash: bcrypt.hashSync("admin123", 10),
};
