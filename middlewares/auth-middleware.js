const jwt = require("jsonwebtoken");
const { User } = require("../models");

//Authorization: Bearer JWT토큰내용 이렇게 들어옴
module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = (authorization|| "").split(' ');
    
    if (!tokenValue || tokenType !== "Bearer") {
        res.status(401).send({
          errorMessage: "로그인이 필요합니다..",
        });
        return;
    }    
    try{
        const  { userId }  = jwt.verify(tokenValue, "my-secret-key");        
        
        User.findByPk(userId).then((user) => {
            res.locals.user = user;
            next();
        });
        return;
    } catch(error){
        res.status(401).send({
            errorMessage: "로그인이 필요합니다."
        });
        return;
    }
};