import AgentAPI from "apminsight";
AgentAPI.config()


import express from "express";
import cors from 'cors'



import subjectsRouter from './routes/subject.js'
import departmentsRouter from './routes/department.js'
import usersRouter from './routes/users.js'
import classesRouter from './routes/classes.js'
import enrollmentsRouter from './routes/enrollment.js'


import securityMiddleware from "./middleware/security.js";

//for some reason i did see this in backend was it suppose to be in frontend,
import {auth} from './lib/auth.js'
import {toNodeHandler} from 'better-auth/node'

const PORT = process.env.PORT || 3000; //propse by code rabbit


const app = express();

  

if(!process.env.FRONTEND_URL){throw new Error('Frontend_url is not set in .env file')}

app.use(cors({ //this works for some reason, i guess it change
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests (Postman, etc.)

    const allowedOrigins = [
      process.env.FRONTEND_URL,                                           // your main URL
      /^https:\/\/classroom-admin-panel-.*\.vercel\.app$/,               // all preview URLs
    ];

    const isAllowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );

    if (isAllowed) {
      callback(null, origin);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json())
//  // i will disable this for now, i will only enable it when
// app.use(securityMiddleware)

// i found the reason it keep giving me bot detected and also i found what is the missing origin shit is


app.use('/api/subjects',subjectsRouter)

// remove later, this is just to show deparment in subjects listen, just a small exercise
app.use('/api/departments',departmentsRouter)

app.use('/api/users',usersRouter)
app.use('/api/classes',classesRouter)
app.use('/api/enrollments',enrollmentsRouter)


app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});