const express = require("express");
//const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require('bcrypt');
const salt = 10;

const postUsersSchema = Joi.object({
    nickname: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,300}$')),
    password: Joi.string().min(4).required(),
    confirm: Joi.string().min(4).required(),
  });

router.post("/signup", async (req, res) => {
    try {
        const { nickname, password, confirm } = await postUsersSchema.validateAsync(req.body);
    
        if (password !== confirm) {
            res.status(400).send({
                errorMessage: "패스워드가 패스워드 확인란과 동일하지 않습니다.",
            });
            return;
        }
        
        if(password.includes(nickname)){
            res.status(400).send({
                errorMessage: "닉네임이 패스워드에 포함됩니다.",
            });
            return;
        }

        const existUsers = await User.findAll({
        where: {
            nickname,
        },
        });
        if (existUsers.length) {
            res.status(400).send({
                errorMessage: "중복된 닉네임 입니다.",
            });
            return;
        }
        
        const hash = bcrypt.hashSync(password, salt);
        await User.create({ nickname, password: hash, });
        res.status(201).send({
            "message": "회원 가입에 성공하였습니다."
        });
    } catch(err) {
        console.log(err);
        res.status(400).send({
            errorMessage: "요청한 데이터 형식이 올바르지 않습니다.",
        });
    }
  });
  
  router.post("/login", async (req, res) => {
    const { nickname, password } = req.body;
  
    const user = await User.findOne({ where: { nickname } });
  
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(400).send({
        errorMessage: "닉네임 또는 패스워드를 확인해주세요.",
      });
      return;
    }
  
    const token = jwt.sign({ userId: user.userId }, "my-secret-key", {expiresIn: '1h'});
    res.send({
      token,
    });
  });

module.exports = router;