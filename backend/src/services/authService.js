import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { readDb, writeDb } from "../../database/database.js";

const JWT_SECRET = "secret";

export default {
  async register({ username, password, profilePicture }) {
    const db = await readDb();
    const existing = db.users.find((u) => u.username === username);
    
    if (existing) {
      const error = new Error("Username already taken");
      error.statusCode = 400;
      throw error;
    }

    const newUser = {
      id: crypto.randomUUID(),
      username,
      password,
      profilePicture: profilePicture || ""
    };

    db.users.push(newUser);
    await writeDb(db);

    return {
      id: newUser.id,
      username: newUser.username,
      profilePicture: newUser.profilePicture,
    };
  },

  async login({ username, password }) {
    const db = await readDb();
    const user = db.users.find((u) => u.username === username && u.password === password);

    if (!user) {
      const error = new Error("Invalid username or password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    };
  },

 
  async verify(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (err) {
      const error = new Error("Invalid token");
      error.statusCode = 401;
      throw error;
    }
  }
};