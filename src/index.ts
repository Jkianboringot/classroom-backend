import express from "express";
import { subjects } from "./db/schema/app.js";
import subjectsRouter from './routes/subject'
import cors from 'cors'
import { errorMonitor } from "node:events";


const app = express();


app.use(express.json())

if(!process.env.FRONTEND_URL){throw new Error('Frontend_url is not set in .env file')}

app.use(cors({
  origin:process.env.FRONTEND_URL,
  methods:['GET','POST','PUT','DELETE'],
  credentials:true
}))

app.use('api/subjects',subjectsRouter)

app.get('/',(fuck,shit)=>{
    shit.send('fuckyou bitch')
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});