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

routes.post('/carga/registrar', authuser, async (req,res)=>{
    try{
     const client=await pool.connect()
     const {nome_carga,peso_carga,massa_carga}= req.body
     const id_empresa=req.usuarioJWT.id
     const values=[nome_carga,id_empresa,peso_carga,massa_carga]
     const registerCarga= await client.query(`INSERT INTO carga (nome_carga,id_empresa,peso_carga,massa_carga) 
     VALUES ($1,$2,$3,$4)`,values);
     const response= await client.query(`SELECT * FROM carga
     WHERE nome_carga = '${nome_carga}' AND id_empresa = '${id_empresa}' AND peso_carga = '${peso_carga}' `)
     res.status(200).json({
        status: 'ok',
        resposta: response.rows
     })
    }
    catch(err){
        res.status(400).json({
            status: 'negado',
            resposta: String(err)
         })
    }
})

routes.get('/carga/consultar',authuser, async (req,res)=>{
    try{
        const client=await pool.connect();
        const id_empresa=req.usuarioJWT.id
        const cargas_empresa = await client.query(`SELECT * FROM carga WHERE id_empresa=${id_empresa}`);
        res.status(200).json({
            status: 'ok',
            data: cargas_empresa.rows
        })
    }
    catch(err){
        res.status(400).json({
            status: 'negado',
            resposta: String(err)
         })
    }
})

routes.put('/carga/atualizar',authuser, async (req,res)=>{
    try{
        const client=await pool.connect();
        const {id_carga,peso_carga,massa_carga}= req.body;
        const id_empresa=req.usuarioJWT.id
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
        const agendarAtualizacaoCarga = (time)=>{
          return new Promise((resolve,reject)=>{
            setTimeout(async ()=>{
                const carga_atualizada=await client.query(`UPDATE carga 
                SET peso_carga=${peso_carga}, massa_carga=${massa_carga}
                WHERE id_empresa=${id_empresa} AND id_carga=${id_carga} `)
                resolve('carga atualizada com suceso')
            },time)
          })
        }
       agendarAtualizacaoCarga(delay)
        res.status(200).json({
            status: 'ok',
            data: 'carga atualizada com agendamento bem sucedida'
        })
    }
    catch(err){
        res.status(400).json({
            status: 'negado',
            resposta: String(err)
         })
    }
})

routes.delete('/carga/deletar',authuser, async (req,res)=>{
    try{
        const client=await pool.connect();
        const {id_carga}= req.body;
        const id_empresa=req.usuarioJWT.id
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
                    const cargas_empresa = await client.query(`DELETE FROM carga 
                    WHERE id_empresa=${id_empresa} AND id_carga=${id_carga}`);
                    resolve('carga deletada com sucesso')
                },time)
            })
        }
       agendarDeleteCarga(delay)
        res.status(200).json({
            status: 'ok',
            data: 'carga deletada com agendamento bem sucedida'
        })
    }
    catch(err){
        res.status(400).json({
            status: 'negado',
            resposta: String(err)
         })
    }
})

module.exports=routes