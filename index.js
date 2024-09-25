import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import userRouter from "./Router/user.router.js";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use("", userRouter);

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res
      .status(400)
      .json({ error: "Missing required parameter: 'messages'." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (e) {
    console.log("Cannot connect to DB or port", e);
  }
};

connectDB();
