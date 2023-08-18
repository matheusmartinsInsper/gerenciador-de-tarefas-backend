const express = require('express');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const {Pool}=require('pg')
require('dotenv').config()
const routes=express.Router()

const configUser={
    user: process.env.USER,
    host: process.env.LOCALHOST,
    database: process.env.NAME_DATABASE,
    password: process.env.SECRET_JWT,
    port: 5432,
}


const pool=new Pool(configUser)

routes.post('/usuario/signup',async (req,res)=>{
    try{
    let {email,senha,nome,type} = req.body
    const client = await pool.connect()
    
    // hashurando a senha do usuario

    const numberhash=10;
    const senhaHash=await bcrypt.hash(senha,numberhash);
    const values = [email,senhaHash,nome,type]
    const respostaDB = await client.query(`INSERT INTO usuario (email,senha,nome,type_usuario) VALUES ($1,$2,$3,$4)`,values)
    const respostaDbSucess = await client.query(`SELECT * FROM usuario WHERE email='${email}'`);
    res.status(200).json({
            status: 'ok',
            data: respostaDbSucess.rows
        })
    }
    catch(err)
    {
    res.status(400).json({
        status: 'negado',
        messagem: String(err)
    })
    }
})

routes.get('/usuario/logar', async (req,res)=>{
    try{
    const senha = req.query.senha;
    const email = req.query.email
    const client = await pool.connect()
    const resposta = await client.query(`SELECT id_usuario, senha,nome FROM usuario WHERE email='${email}'`);
    const senhaHashurada = resposta.rows[0].senha
    const nomeuser = resposta.rows[0].nome
    const ID=resposta.rows[0].id_usuario
    if(!ID){
        res.status(400).json({
            status: 'negado',
            messagem: 'Usuario nao cadastrado'
        })
    }
    const senhaCorreta= await bcrypt.compare(senha,senhaHashurada)
    if(senhaCorreta) {
      let token = await jwt.sign({id:ID},process.env.SECRET_JWT,{expiresIn: '1d'});
      
      res.status(200).json({
          status: 'ok',
          messagem : 'usuario logado com sucesso',
          nome: nomeuser,
          x_auth_user: token
      })
    }
    else {
        res.status(400).json({
            status: 'negado',
            messagem : 'senha errada'
    })
    }
    }
    catch(err){
        res.status(400).json({
            status:'negado',
            messagem: String(err)
        })
    }
})

module.exports=routes