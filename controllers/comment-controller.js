const { prisma } = require("../prisma/prisma-client");

const CommentController = {
  createComment: async (req, res) => {
    const { postId, content } = req.body;
    const userId = req.user.userId;

    if (!postId || !content) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }
    try {
      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
        },
      });
      res.json(comment);
    } catch (error) {
      console.error("Create Comment", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const comment = await prisma.comment.findUnique({ where: { id } });

      if (!comment) {
        return res.status(404).json({ error: "Комментарий не найден" });
      }

      if (comment.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Вы не авторизованы для удаления этого комментария" });
      }

      await prisma.comment.delete({ where: { id } });

      res.json(comment);
      res.send("delete");
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Не удалось удалить комментарий" });
    }
  },
};

module.exports = CommentController;