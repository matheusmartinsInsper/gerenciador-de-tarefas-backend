const express = require('express');
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

routes.get('/viagem/consultar',authuser,async (req,res)=>{
    try{
     const client = await pool.connect()
     const id_usuario = req.usuarioJWT.id
     
     //captura fretes do usuario
     const frete= await client.query(`SELECT * FROM frete WHERE id_empresa=${id_usuario}`)
     //captura todas as cargas de todas os fretes

     const Cargasfretes= await client.query(`SELECT * FROM frete 
     INNER JOIN cargafrete ON frete.id_frete = cargafrete.id_frete_emissor
     INNER JOIN carga ON cargafrete.id_carga_emissor=carga.id_carga
     WHERE frete.id_empresa=${id_usuario}`)
     //adiciona um campo chamado cargas em que um respectivo frete contem suas respectivas cargas
     const fretes_cargas=frete.rows.map((item)=>{
        let cargasDofreteitem=[];
       
        id_frete=item.id_frete;
        for(i=0;i<Cargasfretes.rows.length;i++){
            if(id_frete===Cargasfretes.rows[i].id_frete_emissor){
                let carga={};
                carga.nome=Cargasfretes.rows[i].nome_carga;
                carga.peso=Cargasfretes.rows[i].peso_carga;
                carga.massa=Cargasfretes.rows[i].massa_carga;
                carga.id=Cargasfretes.rows[i].id_carga;
                cargasDofreteitem.push(carga)    
            }
        }
        return {...item, cargas: cargasDofreteitem}
     })
     const Veiculosfretes = await client.query(`SELECT * FROM frete 
     INNER JOIN veiculofrete ON frete.id_frete = veiculofrete.id_frete_emissor
     INNER JOIN veiculo ON veiculofrete.id_veiculo_emissor=veiculo.id_veiculo
     WHERE frete.id_empresa=${id_usuario}`)

     const fretes_cargas_veiculos= fretes_cargas.map((item)=>{
        let veiculosDofreteiem=[]
        id_frete=item.id_frete;
        for(i=0;i<Veiculosfretes.rows.length;i++){
            if(id_frete===Veiculosfretes.rows[i].id_frete_emissor){
                let veiculo={}
                veiculo.nome=Veiculosfretes.rows[i].nome_veiculo;
                veiculo.peso=Veiculosfretes.rows[i].peso_veiculo;
                veiculo.id=Veiculosfretes.rows[i].id_veiculo;
                veiculosDofreteiem.push(veiculo)
            }
        }
        return {...item, veiculosAutorizado: veiculosDofreteiem}

     })
    
    // const dataCargasFrete = await client.query(`SELECT * FROM carga WHERE `)
     res.status(200).json({status: 'ok',
                           resposta: fretes_cargas_veiculos
                           })

    }catch(err){
      throw new Error(err)
    }
})

routes.put('/viagem/atualizar',async (req,res)=>{
   try{
       let {cpf,rg,nome}=req.body
       const client = await pool.connect()
       const respostUpadate = await client.query(`UPDATE produto SET nome='${nome}' WHERE rg=${rg} AND cpf=${cpf}`);
       const respostOfUdate = await client.query(`SELECT nome FROM produto WHERE rg=${rg} AND cpf=${cpf}`)
       res.status(200).json({
        status: 'ok',
        resposnse: respostOfUdate.rows
       })
   }
   catch(err){
       throw new Error(err)
   }
})

routes.post('/viagem/criar',authuser, async (req,res)=>{
   try{
       let {origem,destino,data_entrega,ids_veiculos,ids_cargas}=req.body
       const id_empresa = req.usuarioJWT.id
       const values= [origem,destino,data_entrega,id_empresa]
       const client = await pool.connect()
       const responsePost=await client.query(`INSERT INTO frete (origem,destino,data_entrega,id_empresa) 
       VALUES ($1,$2,$3,$4)`,values)
       const fretePostado = await client.query('SELECT * FROM frete ORDER BY id_frete DESC LIMIT 1')
       const fretePostadoID=fretePostado.rows[0].id_frete
       
       //criar relacao veiculo frete
       ids_veiculos.map(async (item,index)=>{
        const idVeiculo=item;
        const value = [idVeiculo,fretePostadoID]
        const registroVeiculoAutorizado = await client.query(`INSERT INTO veiculofrete (id_veiculo_emissor,id_frete_emissor)
        VALUES ($1,$2)`,value)
       })
       ids_cargas.map(async (item,index)=>{
        const idCartga=item;
        const value = [fretePostadoID,idCartga]
        const registroCargas = await client.query(`INSERT INTO cargafrete (id_frete_emissor,id_carga_emissor)
        VALUES ($1,$2)`,value)
       })
       
       res.status(200).json({
           statusk: 'ok',
           response: 'Frete Postado com Sucesso'
       })
   }
   catch(err){
    res.status(400).json({
        status:'error',
        message: String(err)
    }) 
   }
})

routes.delete('/viagem/delet/carga',authuser,async (req,res)=>{
    try{
     let {id_carga_emissor,id_frete_emissor}=req.body
     const id_empresa = req.usuarioJWT.id
     const client = await pool.connect()

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
     const AgendamentoDelet=(time)=>{
        return new Promise((resolve,reject)=>{
            setTimeout(async ()=>{
                const response=await client.query(`DELETE FROM cargafrete 
                WHERE id_frete_emissor=${id_frete_emissor} AND id_carga_emissor=${id_carga_emissor}`)
                resolve('Frete excluido com sucesso')
            },time)
        })
     }
     AgendamentoDelet(delay)
     res.status(200).json({
       status: 'ok',
       message: 'Retirada da carga do frete agendada com sucesso'
     })
    }
    catch(err){
      console.log(String(err))
    }
})

routes.delete('/viagem/delet', authuser,async (req,res)=>{
try{
 let {id_frete}=req.body
 const id_empresa = req.usuarioJWT.id
 const client = await pool.connect()
 const deleteStatus = client.query(`UPDATE frete SET status_frete='deletado' 
 WHERE id_frete=${id_frete} AND id_empresa=${id_empresa}`)
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
 const AgendamentoDelet=(time)=>{
    return new Promise((resolve,reject)=>{
        setTimeout(async ()=>{
            const response=await client.query(`DELETE FROM frete 
            WHERE id_frete=${id_frete} AND id_empresa=${id_empresa}`)
            resolve('Frete excluido com sucesso')
        },time)
    })
 }
 AgendamentoDelet(delay)
 res.status(200).json({
   status: 'ok',
   message: 'Retirada do frete agendada com sucesso'
 })
}
catch(err){
  console.log(String(err))
}
})

module.exports=routes