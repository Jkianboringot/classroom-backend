import AgentAPI from "apminsight";
AgentAPI.config()

import express from "express";
import { subjects } from "./db/schema/app.js";
import subjectsRouter from './routes/subject'
import departmentsRouter from './routes/department'
import cors from 'cors'
import securityMiddleware from "./middleware/security.js";
const PORT = process.env.PORT || 3000; //propse by code rabbit
import {auth} from './lib/auth'
import {toNodeHandler} from 'better-auth/node'

const app = express();

  
app.use(express.json())

if(!process.env.FRONTEND_URL){throw new Error('Frontend_url is not set in .env file')}

app.use(cors({
  origin:process.env.FRONTEND_URL,
  methods:['GET','POST','PUT','DELETE'],
  credentials:true
}))


app.use(securityMiddleware)



app.all('/api/auth/*splat', toNodeHandler(auth));










app.use('/api/subjects',subjectsRouter)

// remove later, this is just to show deparment in subjects listen, just a small exercise
app.use('/api/departments',departmentsRouter)


app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});