const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserController = require("../controllers/user-controller");
const authenticateToken = require("../middleware/auth");

const uploadDestination = "uploads";
// показываем, где хранить файлы
const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    // уникальные имена
    cb(null, file.originalname);
  },
});
// хранилище для фоток
const uploads = multer({
  storage: storage,
});

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", authenticateToken, UserController.current);
router.get("/users/:id", authenticateToken, UserController.getUserById);
router.put("/users/:id", UserController.updateUser);

module.exports = router;
