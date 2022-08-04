const express = require("express");
const Posts = require("./posts");
const Comments = require("./comments");
const Users = require("./users");
const noAuthMiddleware = require("../middlewares/noAuth-middleware");


const router = express.Router();

router.use('/posts/', Posts);
router.use('/comments/', Comments);
router.use('/users/', noAuthMiddleware, Users);

module.exports = router;