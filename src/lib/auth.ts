import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db"; // your drizzle instance
import * as schema  from "../db/schema/auth"; // your drizzle instance


if(!process.env.FRONTEND_URL || !process.env.BETTER_AUTH_SECRET)
    {throw new Error('Frontend_url OR BETTER_AUTH_SECRET is not set in .env file')}


export const auth = betterAuth({
    secret:process.env.BETTER_AUTH_SECRET!,
    trustedOrigins:[process.env.FRONTEND_URL!],
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite",
        schema
    }),

    emailAndPassword:{
        enabled:true
    },
    user:{
        additionalFields:{
            role:{
                type:'string',required:true,defaultValue:'student',input:true
            },
            imageCldPubId:{
                type:'string',required:false,input:true
            }
        }
    }
});