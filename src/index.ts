import AgentAPI from "apminsight";
AgentAPI.config()


import express from "express";
import cors from 'cors'



import subjectsRouter from './routes/subject.js'
import departmentsRouter from './routes/department.js'
import usersRouter from './routes/users.js'
import classesRouter from './routes/classes.js'


import securityMiddleware from "./middleware/security.js";

//for some reason i did see this in backend was it suppose to be in frontend,
import {auth} from './lib/auth.js'
import {toNodeHandler} from 'better-auth/node'

const PORT = process.env.PORT || 3000; //propse by code rabbit


const app = express();

  

if(!process.env.FRONTEND_URL){throw new Error('Frontend_url is not set in .env file')}

app.use(cors({
  origin:process.env.FRONTEND_URL,
  methods:['GET','POST','PUT','DELETE'],
  credentials:true
}))

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json())
app.use(securityMiddleware)
//  // i will disable this for now, i will only enable it when
// i found the reason it keep giving me bot detected and also i found what is the missing origin shit is


app.use('/api/subjects',subjectsRouter)

// remove later, this is just to show deparment in subjects listen, just a small exercise
app.use('/api/departments',departmentsRouter)

app.use('/api/users',usersRouter)
app.use('/api/classes',classesRouter)


app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});