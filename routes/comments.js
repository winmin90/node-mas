const express = require("express");
//const Comment = require("../schemas/comment");
const Comment  = require("../models").comment;
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");

//댓글 목록 조회
router.get("/:_postId", async (req, res) => {
  try {
    const _id = req.params._postId;

    if (!_id) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    let comments = await Comment.findAll({ where: {postId: _id} })
    comments = comments.sort((a,b)=> b.createdAt-a.createdAt);

    let resultList = [];

    for (const comment of comments) {
      resultList.push({
        commentId: comment.id,
        user: comment.user,
        content: comment.content,
        createdAt: comment.createdAt,
      });
    }

    res.status(200).json({ data: resultList });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

//댓글 생성
router.post("/:_postId", authMiddleware, async (req, res) => {
  try {
    const _id = req.params._postId;

    const { nickname } = res.locals.user;
    const content = req.body["content"];

    if (!content) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
      return;
    }

    if (!_id || !nickname) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
      return;
    }


    await Comment.create({ postId: _id, user: nickname, content });

    res.status(201).json({ message: "댓글을 작성하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

// 댓글 수정
router.put("/:_commentId", authMiddleware, async (req, res) => {
  try {
    const id = req.params._commentId;
    const content = req.body["content"];

    if (!content) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
      return;
    }

    if (!id) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    const isExist = await Comment.findOne({where: { id } });
    if (!isExist) {
      res.status(404).json({ message: '댓글 조회에 실패하였습니다.' });
      return;
    }

    if(isExist.user != res.locals.user.nickname){
      res.status(403).json({ message: '댓글 수정 권한이 없습니다.' });
      return;
    }

    isExist.content = content
    await isExist.save();
    res.status(201).json({ message: "댓글을 수정하였습니다." });
    //await Comment.update({ content }, { where: { id } });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

// 댓글 삭제
router.delete("/:_commentId", authMiddleware, async (req, res) => {
  try {
    const id = req.params._commentId;

    if (!id) { // TODO: Joi를 사용하지 않음
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    const isExist = await Comment.findOne({where: { id }});

    if (!isExist) {
      res.status(404).json({ message: '댓글 조회에 실패하였습니다.' });
      return;
    }

    if(isExist.user != res.locals.user.nickname){
      res.status(403).json({ message: '댓글 삭제 권한이 없습니다.' });
      return;
    }

    await isExist.destroy();
    //await Comment.destroy({ where: { id } });
    res.status(201).json({ message: "댓글을 삭제하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

 module.exports = router;