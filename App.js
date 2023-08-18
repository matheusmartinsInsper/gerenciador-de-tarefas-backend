const express = require('express');
const cors = require('cors')

const user=require('./src/routes/user')
const viagem = require('./src/routes/viagem')
const carga=require('./src/routes/carga')
const app=express();


const PORT =3000
app.use(cors())
app.use(express.json());
app.use('/', user)
app.use('/', viagem)
app.use('/', carga)
app.listen(PORT,()=>{console.log(`app run in port: ${PORT}`)})