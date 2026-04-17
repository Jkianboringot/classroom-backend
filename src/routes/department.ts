// ps. this was made because i want to show the department in subject listen, this is not the best 
// way but i choose this because its cleaner and easy to remove later on
// just for exercise,

import { and, desc, eq, getTableColumns, ilike, name, notIlike, or, sql } from "drizzle-orm";
import express from "express"
import { classes, departments, subjects, user } from "../db/schema/index.js";
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


router.get('/:id/subjects', async (req, res) => {
    const classId = Number(req.params.id);
        console.log('show ')

    if(!Number.isFinite(classId)) return res.status(400).json({ error: 'No Class found.' });

    const [classDetails] = await db
        .select({
            ...getTableColumns(classes),
            subject: { //it is done this way because of accessorKey, it pretty much allows you to get all data of subject by json, key, we just are just 
                //pretty much putting everything return by  ...getTableColumns(subjects), in key {subject: ...getTableColumns(subjects)} like that, so something 
                //like this can be done accessorKey: 'subject.name', 
                ...getTableColumns(subjects),
            },
            department: {
                ...getTableColumns(departments),
            },
            teacher: {
                ...getTableColumns(user),
            }
        })
        .from(classes)
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(classes.id, classId))


    if(!classDetails) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: classDetails });
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