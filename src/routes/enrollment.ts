import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";

import { enrollments, user } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();



router.post('/', async (req, res) => {
    try {
        // req returns { classId: 3, studentId: 'OO1Y7Sms2EZtUQVLJijGTfwlrkNnBs5e' }
        // find where this is comming from how are they sending it
        //also the way you send data in frontend will determine how you order you var for destructuring

        const studentEnrolled = req.body.studentId
        const classEnrolled = req.body.classId


        const userExist = await db.select({
            studentId: enrollments.studentId,
            classId: enrollments.classId,
        }).from(enrollments)
            // this thing need ot match fro both studentId and classes, because same student can bt in toher calss and this just check if
            // student is already in enroll which is wrong becuase it will flag it unique as long as he is enroll on even one class
            .where(and(
                eq(enrollments.studentId, studentEnrolled),
                eq(enrollments.classId, classEnrolled)
            ))

        console.log(userExist) //this is always empty no matter waht








        //ok in the future i will 
        if (userExist.length > 0) {
            console.log('uses does exix')
            //➗i think a way to fix this is in ui not here
                // -ok if the error is red and showing already enrolled even though 
                // its not enrolled yet , i dont know it does that sometimes i think its a bug or 
                // something, fix this later
                // also its better for it to redirect and say that it is already
                // enrolled rather than just throw an error
            res.status(409).json({ error: 'Already Enrolled' })
        }
        else {
            const [createUser] = await db
                .insert(enrollments)
                .values({ ...req.body })
                .returning({
                    studentId: enrollments.studentId,
                    classId: enrollments.classId,
                });

            if (!createUser) throw Error;

            res.status(201).json({ data: createUser });
        }

    } catch (e) {
        console.error(`POST /enrollments error ${e}`);
        res.status(500).json({ error: e })
    }
})
export default router;