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

      const png = Jdenticon.toPng(name, 200);
      const avatarName = `${name} ${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "../uploads", avatarName);
      fs.writeFileSync(avatarPath, png);
      //4. Отправляем пользователя в бд
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarPath}`,
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
    res.send("getUserById");
  },
  updateUser: async (req, res) => {
    res.send("updateUser");
  },
  current: async (req, res) => {
    res.send("current");
  },
};

module.exports = UserController;
