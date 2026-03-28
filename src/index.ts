import express from "express";
import {PORT} from '../config/env.js'
import { subjects } from "./db/schema/app.js";
import subjectsRouter from './routes/subject'

const app = express();

app.use(express.json())


app.use('api/subjects',subjectsRouter)

app.get('/',(fuck,shit)=>{
    shit.send('fuckyou bitch')
})

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});