const jwt = require("jsonwebtoken");
const { User } = require("../models");
module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = (authorization || "").split(' ');
    
    if (!tokenValue || tokenType !== "Bearer") {
        next();
        return;
    }

    try{
        const { userId } = jwt.verify(tokenValue, "my-secret-key");
        
        const user = User.findByPk(userId).then((user) => {
            res.locals.user = user;
            res.status(401).send({
                errorMessage: "이미 로그인이 되어있습니다.",
            });
            return;
        });
    } catch(error){
        res.status(401).send({
            errorMessage: "로그인 시간이 만료되었습니다.",
        });
        return;
    }
};