const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const Jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;
    // 1. Проверяем ввел ли пользователь все нужные данные
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Все поля обязательные" });
    }
    //2. Проверяем, существует ли такой пользователь в бд
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Пользователь уже существует" });
      }

      // 3. хэшируем пароль и создаем рандомную картинку
      const hashedPassword = await bcrypt.hash(password, 10);

      const png = Jdenticon.toPng(`${name}${Date.now()}`, 200);
      const avatarName = `${name}${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "/../uploads", avatarName);
      fs.writeFileSync(avatarPath, png);
      //4. Отправляем пользователя в бд
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });
      res.json(user);
    } catch (error) {
      console.error("Error in register", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Все поля обязательные" });
    }
    // Ищем в бд, email, если его нет - то ввели не тот
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ error: "Неверный логин или пароль" });
      }

      // Ищем в бд пароль, с помощью compare тк пароль хэшируемый
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Неверный логин или пароль" });
      }
      // шифруем id пользователя и ставим секретный ключ
      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);
      res.json(token);
    } catch (error) {
      console.error("Login Error", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }
      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [
            {
              followerId: userId,
            },
            { followingId: id },
          ],
        },
      });
      res.json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (error) {
      console.error("Get current error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    // пришел ли вообще файл с фронта
    let filePath;
    if (req.file && req.file.path) {
      filePath = req.file.path;
    }
    if (id !== req.user.userId) {
      return res.status(403).json({ error: "нет доступа" });
    }
    try {
      // email уникальный
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: { email },
        });
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Почта уже используется" });
        }
      }
      const user = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
        },
      });
      res.json(user);
    } catch (error) {
      console.error("Update User", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        // сверяем айдишник с бд
        where: {
          id: req.user.userId,
        },
        // это пздц я до сих пор не понял
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });
      if (!user) {
        return res.status(400).json({ error: "Не удалось найти пользователя" });
      }
      res.json(user);
    } catch (error) {
      console.error("current", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = UserController;
