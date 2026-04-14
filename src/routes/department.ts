// ps. this was made because i want to show the department in subject listen, this is not the best 
// way but i choose this because its cleaner and easy to remove later on
// just for exercise,

import { and, desc, eq, getTableColumns, ilike, name, notIlike, or, sql } from "drizzle-orm";
import express from "express"
import { departments, subjects } from "../db/schema/index.js";
import { db } from "../db/index.js";
const router = express.Router()

//get all subject with search and filtering
router.get('/', async (req, res) => {
    try {

        const departmentList = await db.select({
            id:departments.id,
            name: departments.name
        }).from(departments)


        res.status(200).json({
            data: departmentList

        })

    } catch (error) {
        console.error(`Get deparments error: ${error}`)
        res.status(500).json({ error: 'Failed to get deparments' })
    }
})


router.post('/', async (req, res) => {
    try {
        const [createDepartment] = await db
            .insert(departments)
            .values({...req.body})
            .returning({ id: departments.id });

        if(!createDepartment) throw Error;

        res.status(201).json({ data: createDepartment });
    } catch (e) {
        console.error(`POST /departments error ${e}`);
        res.status(500).json({ error: e})
    }
})



export default router