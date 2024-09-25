import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const register = async (req, res) => {
  try {
    const { name, surName, email, password, age } = req.body;

    const findUser = await User.findOne({ email });

    if (findUser) {
      return res.status(400).json({ message: "User Already Registered" });
    }

    const newUser = new User({ name, surName, age, password, email });
    await newUser.save();

    res
      .status(201)
      .json({ message: "User Successfully Registered", user: newUser });
  } catch (e) {
    res.status(500).json({ message: "Server error", e: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email });

    if (!findUser) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await findUser.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { email: findUser.email },
      process.env.ACCESS_TOKEN,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { email: findUser.email },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ accessToken, refreshToken });
  } catch (e) {
    res.status(500).json({ message: "Server Error", e: e.message });
  }
};

const Authorization = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getProfile = [
  Authorization,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email }).select(
        "-password"
      );
      if (!user) {
        return res.status(404).json({ message: "User not Found" });
      }
      res.status(200).json(user);
    } catch (e) {
      res.status(500).json({ message: "Server error", e: e.message });
    }
  },
];

const updateUser = [
  Authorization,
  async (req, res) => {
    try {
      const { name, surName, age } = req.body;
      const updateUser = await User.findOneAndUpdate(
        { email: req.user.email },
        { name, surName, age },
        { new: true, runValidators: true }
      ).select("-password");

      if (!updateUser) {
        return res.sendStatus(403);
      }

      res
        .status(200)
        .json({ message: "User Successfully Updated", updateUser });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
];

const deleteAllUserMessages = [
  Authorization,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });

      const result = await User.updateMany(
        { email: user.email },
        { $set: { messages: [] } }
      );

      res
        .status(200)
        .json({
          message: "All user messages successfully deleted",
          modifiedCount: result.modifiedCount,
        });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
];

const logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Successfully logged out" });
  } catch (e) {
    res.status(500).json({ message: "Server error", e: e.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.sendStatus(401);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
      if (err) return res.sendStatus(403);

      const newAccessToken = jwt.sign(
        { email: user.email },
        process.env.ACCESS_TOKEN,
        {
          expiresIn: "15m",
        }
      );
      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const messageHandle = [
  Authorization,
  async (req, res) => {
    try {
      const { chat } = req.body;
      const user = await User.findOne({ email: req.user.email });

      if (!user) {
        return res.sendStatus(403);
      }

      const combinedMessages = [...user.messages, ...chat];

      const messageMap = new Map();
      combinedMessages.forEach((msg) => messageMap.set(msg.id, msg));

      const uniqueMessages = Array.from(messageMap.values());

      const recentMessages = uniqueMessages.slice(-10);

      const updateUser = await User.findOneAndUpdate(
        { email: req.user.email },
        { messages: recentMessages },
        { new: true, runValidators: true }
      ).select("-password");

      res
        .status(200)
        .json({ message: "User Successfully Updated", updateUser });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
];

export default {
  login,
  register,
  getProfile,
  updateUser,
  logout,
  refreshToken,
  messageHandle,
  deleteAllUserMessages,
};
