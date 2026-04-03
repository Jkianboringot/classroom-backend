// ps. this was made because i want to show the department in subject listen, this is not the best 
// way but i choose this because its cleaner and easy to remove later on
// just for exercise,

import { and, desc, eq, getTableColumns, ilike, name, notIlike, or, sql } from "drizzle-orm";
import express from "express"
import { departments, subjects } from "../db/schema";
import { db } from "../db";
const router = express.Router()

//get all subject with search and filtering
router.get('/', async (req, res) => {
    try {

        const departmentList = await db.select({
            name: departments.name
        }).from(departments)


        res.status(200).json({
            data: departmentList

        })

    } catch (error) {
        console.error(`Get /subjects error: ${error}`)
        res.status(500).json({ error: 'Failed to get deparments' })
    }
})


export default router