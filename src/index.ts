import express from "express";
import {PORT} from '../config/env.js'
import { subjects } from "./db/schema/app.js";
import subjectsRouter from './routes/subject'
import cors from 'cors'


const app = express();


app.use(express.json())

app.use(cors({
  origin:process.env.FRONTEND_URL,
  methods:['GET','POST','PUT','DELETE'],
  credentials:true
}))

app.use('api/subjects',subjectsRouter)

app.get('/',(fuck,shit)=>{
    shit.send('fuckyou bitch')
})

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});