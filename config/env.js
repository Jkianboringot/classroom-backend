import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "dev"}` });


// this pretty much do destructuring or spread, where all value in process.env is pare with 
// the corresponding key label
export const {
    PORT
} =process.env