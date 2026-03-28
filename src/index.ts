import express from "express";
import {PORT} from '../config/env.js'


const app = express();

app.use(express.json())
//ok so the parameter in this callback where req and res are suppose to be is order base, meaning 
// you can name it anything you want, the first param will always be req once, and the second is the res once
// i was about to ask ai it but i figure it out myself fuck, the more you know
app.get('/',(fuck,shit)=>{
    shit.send('fuckyou bitch')
})

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});