const express= require('express');
const {Pool}=require('pg')
const routes=express.Router()
const authuser=require('../middlewares/auth')
require('dotenv').config()

const configUser={
    user: process.env.USER,
    host: process.env.LOCALHOST,
    database: process.env.NAME_DATABASE,
    password: process.env.SECRET_JWT,
    port: 5432,
}


const pool=new Pool(configUser)

routes.post('/veiculo/registrar', authuser, async (req,res)=>{
     try{
      const client = await pool.connect()
      const {nome_veiculo,peso_veiculo}=req.body
      const id_usuario=req.usuarioJWT.id
      const values = [id_usuario,nome_veiculo,peso_veiculo]
      const registrarCarga = await client.query(`INSERT INTO veiculo (id_usuario,nome_veiculo,peso_veiculo)
      VALUES ($1,$2,$3)`,values)
      res.status(201).json({
        status: 'ok',
        messagem: 'Veiculo registrado com sucesso'
      })
     }
     catch(err){
        res.status(400).json({
            status: 'negado',
            messagem: String(err)
          })
     }
 })
routes.get('/veiculo/consultar', authuser, async (req,res)=>{
     try{
        const client=await pool.connect();
        const id_usuario=req.usuarioJWT.id
        const veiculos_usuario = await client.query(`SELECT * FROM carga WHERE id_usuario=${id_usuario}`);
        res.status(200).json({
            status: 'ok',
            data: veiculos_usuario.rows
        })
     }
     catch(err){
        res.status(400).json({
            status: 'negado',
            messagem: String(err)
          })
     }
 })

routes.put('/veiculo/atualizar', authuser, async (req,res)=>{
     try{
        const client=await pool.connect();
        const {id_veiculo,nome_veiculo,peso_veiculo}=req.body
        const id_usuario=req.usuarioJWT.id
        //capturando tempo de agendamento
        const date=new Date().toLocaleTimeString();
        const dateArray = date.split(':')
       
        const newDateArray = dateArray.map((item,index)=>{
        if(index===0){
        return  item=item*3600
        }
        if(index===1){
        return  item=item*60
        }else{
        return parseInt(item)
        }
        })
        const sumTime = newDateArray.reduce((amount,count)=>{return amount=amount+count},0)
        const delay = (108000-sumTime)*1000
        const atualiza_veiculo = await client.query(`UPDATE veiculo
        SET nome_veiculo=${nome_veiculo},peso_veiculo=${peso_veiculo} 
        WHERE id_veiculo=${id_veiculo} AND id_usuario=${id_usuario}`);

        const veiculo_atualizado = await client.query(`SELECT FROM veiculo 
        WHERE id_veiculo=${id_veiculo} AND id_usuario=${id_usuario}`)

        res.status(200).json({
            status: 'ok',
            data: veiculo_atualizado.rows
        })
     }
     catch(err){
        res.status(400).json({
            status: 'negado',
            messagem: String(err)
          })
     }
 })

routes.delte('/veiculo/deletar', authuser, async (req,res)=>{
     try{
        const client=await pool.connect();
        const {id_carga}= req.body;
        const id_usuario=req.usuarioJWT.id
        //capturando tempo de agendamento
        const date=new Date().toLocaleTimeString();
        const dateArray = date.split(':')
       
        const newDateArray = dateArray.map((item,index)=>{
        if(index===0){
        return  item=item*3600
        }
        if(index===1){
        return  item=item*60
        }else{
        return parseInt(item)
        }
        })
        const sumTime = newDateArray.reduce((amount,count)=>{return amount=amount+count},0)
        const delay = (108000-sumTime)*1000
        const agendarDeleteCarga = (time)=>{
            return new Promise((resolve,reject)=>{
                setTimeout(async ()=>{
                    const cargas_empresa = await client.query(`DELETE FROM veiculo 
                    WHERE id_usuario=${id_usuario} AND id_carga=${id_carga}`);
                    resolve('carga deletada com sucesso')
                },time)
            })
        }
       agendarDeleteCarga(delay)
        res.status(200).json({
            status: 'ok',
            data: 'veiculo deletado com agendamento bem sucedido'
        })
     }
     catch(err){
        res.status(400).json({
            status: 'negado',
            messagem: String(err)
          })
     }
 })