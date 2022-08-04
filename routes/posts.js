const express = require("express");
//const Post = require("../schemas/post");
const Post  = require("../models").post

const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");


// 모든 게시글 데이터를 반환하는 함수
router.get("/", async (req, res) => {
  try {
    let posts = await Post.findAll()
    posts = posts.sort((a,b)=> b.createdAt-a.createdAt );
    let resultList = [];

    for (const post of posts) {
      resultList.push({
        postId: post.id,
        user: post.user,
        title: post.title,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        likes: post.likedBy.split(" ").length-1,
      });
    }

    res.status(200).json({ data: resultList });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

//좋아요 게시글 조회
router.get("/like", authMiddleware, async (req, res) => {
  try {
    const { nickname } = res.locals.user;

    const isExist = await Post.findAll();

    const likePost = isExist.filter((post) => post.likedBy
      .split(" ").includes(nickname))
      .sort((a, b) => b.likedBy.split(" ").length - a.likedBy.split(" ").length);
    //???? 질문하기 이렇게 해도 됌? isExist.filter((post) => post.likedBy.split(" ").includes(nickname)).sort({ likedBy.split(" ").length: -1})

    res.status(200).json({ data: likePost.map((post)=> ({
      postId: post.id,
      userId: post.user,
      nickname,
      title: post.title,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likedBy.split(" ").length-1,
    }) ) });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

//게시글 상세 조회
router.get("/:_postId", async (req, res) => {
  try {
    const id = req.params._postId;

    if (!id) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    const post = await Post.findOne({ where: { id } });

    const result = {
      postId: post.id,
      user: post.user,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likedBy.split(" ").length-1,
    };

    res.status(200).json({ data: result });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

//개시글 생성
router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = res.locals.user.nickname;
    const title = req.body["title"];
    const content = req.body["content"];
    const likedBy = "";

    if (!user || !title || !content) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    await Post.create({ user, title, content, likedBy });

    res.status(201).json({ message: "게시글을 생성하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

//게시글 수정
router.put("/:_postId", authMiddleware, async (req, res) => {
  try {
    const id = req.params._postId;

    const user = res.locals.user.nickname;
    const title = req.body["title"];
    const content = req.body["content"];

    if (!id || !user || !title || !content) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    const isExist = await Post.findOne({ where: { id } });
    if (!isExist) {
      res.status(404).json({ message: '게시글 조회에 실패하였습니다.' });
      return;
    }

    if (isExist.user != res.locals.user.nickname) {
      res.status(403).json({ message: '권한이 없습니다.' });
      return;
    }

    isExist.title = title;
    isExist.content = content;
    isExist.save();

    res.status(201).json({ message: "게시글을 수정하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

// 게시글 좋아요
router.patch("/:_postId/like", authMiddleware, async (req, res) => {
  try {
    const id = req.params._postId;
    const { nickname } = res.locals.user;

    const isExist = await Post.findOne({ where: { id } });

    if (!isExist) {
      res.status(404).json({ message: '게시글 조회에 실패하였습니다.' });
      return;
    }

    let likedList = isExist.likedBy.split(" ");
    let i = 0;
    for (i = 0; i < likedList.length; i++) {
      if (likedList[i] === nickname) {
        likedList.splice(i, 1);
        i--;
        break;
      }
    }

    isExist.likedBy = likedList.join(" ");
    let msg = "게시글의 좋아요를 취소하였습니다.";

    if (i === likedList.length) {
      isExist.likedBy += " " + nickname;
      msg = "게시글의 좋아요를 등록하였습니다."
    }

    await isExist.save();
    res.status(201).json({ message: msg });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

// 게시글 삭제
router.delete("/:_postId", authMiddleware, async (req, res) => {
  try {
    const id = req.params._postId;

    const isExist = await Post.findOne({ where: { id } });

    if (!isExist || !id) {
      res.status(404).json({ message: '게시글 조회에 실패하였습니다.' });
      return;
    }
    if (isExist.user != res.locals.user.nickname) {
      res.status(403).json({ message: '권한이 없습니다.' });
      return;
    }

    await isExist.destroy();
    res.status(201).json({ message: "게시글을 삭제하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});


module.exports = router;