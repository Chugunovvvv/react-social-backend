const jwt = require("jsonwebtoken");
// проверяем авторизован ли пользователей
const authenticateToken = (res, req, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // расшифровываем токен, который был у пользователя. если ошибки нет  то записываем его
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid Token" });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
