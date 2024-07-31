const { prisma } = require("../prisma/prisma-client");

const FollowController = {
  followUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;
    if (followingId === userId) {
      return res
        .status(403)
        .json({ error: "Вы не можете подписаться на себя" });
    }
    try {
      const existingFollow = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });
      if (existingFollow) {
        return res.status(400).json({ error: "Подписка уже существует" });
      }
      await prisma.follows.create({
        data: {
          follower: {
            connect: {
              id: userId,
            },
          },
          following: {
            connect: {
              id: followingId,
            },
          },
        },
      });
      res.status(201).json({ message: "Подписка успешно создана" });
    } catch (error) {
      console.error("Follow Error", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  unFollowUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;

    try {
      const follows = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: followingId }],
        },
      });

      if (!follows) {
        return res.status(404).json({ error: "Запись не найдена" });
      }

      await prisma.follows.delete({
        where: { id: follows.id },
      });

      res.status(200).json({ message: "Отписка успешно выполнена" });
    } catch (error) {
      console.log("error", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  },
};

module.exports = FollowController;
