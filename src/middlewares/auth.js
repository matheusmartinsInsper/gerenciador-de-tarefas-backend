const jwt = require('jsonwebtoken');
//const tratarerros=require('../functions/tratarerros')

async function authUser(req,res,next) {
    const token=req.header('Authorization');
    if(!token){
        //return tratarerros()
    }
    try{
        const decoded=jwt.verify(token,process.env.SECRET_JWT);
        req.usuarioJWT=decoded
        next()
    }catch(err){
       console.log(err)
    }
}
module.exports=authUser