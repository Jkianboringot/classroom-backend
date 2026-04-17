// ps. this was made because i want to show the department in subject listen, this is not the best 
// way but i choose this because its cleaner and easy to remove later on
// just for exercise,

import { and, desc, eq, getTableColumns, ilike, name, notIlike, or, sql } from "drizzle-orm";
import express from "express"
import { classes, departments, subjects, user ,enrollments} from "../db/schema/index.js";
import { db } from "../db/index.js";
const router = express.Router()

//get all subject with search and filtering
router.get('/', async (req, res) => {
    try {

        const departmentList = await db.select({
            id: departments.id,
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
    const departmentId = Number(req.params.id);
    console.log('subjects ')

    if (!Number.isFinite(departmentId)) return res.status(400).json({ error: 'No Class found.' });

    const [departmentSubject] = await db
        .select({
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
            description: subjects.description,
            createdAt: subjects.createdAt

        })
        .from(subjects)
        .where(eq(subjects.departmentId, departmentId))


    console.log(departmentSubject)
    if (!departmentSubject) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: departmentSubject });
})



router.get('/:id/classes', async (req, res) => {
    const departmentId = Number(req.params.id);
    console.log('classes ')

    if (!Number.isFinite(departmentId)) return res.status(400).json({ error: 'No Class found.' });

    const [departmentClass] = await db
        .select({
            ...getTableColumns(classes),
            subject: { //it is done this way because of accessorKey, it pretty much allows you to get all data of subject by json, key, we just are just 
                //pretty much putting everything return by  ...getTableColumns(subjects), in key {subject: ...getTableColumns(subjects)} like that, so something 
                //like this can be done accessorKey: 'subject.name', 
                ...getTableColumns(subjects),
            },

            teacher: {
                ...getTableColumns(user),
            }
        })
        .from(classes)
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .innerJoin(user, eq(classes.teacherId, user.id))
        .where(eq(subjects.departmentId, departmentId))

    console.log(departmentClass)

    if (!departmentClass) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: departmentClass });
})




router.get('/:id/users', async (req, res) => {
    const departmentId = Number(req.params.id);
    console.log('users ')

    if (!Number.isFinite(departmentId)) return res.status(400).json({ error: 'No Class found.' });

    const [departmentUser] = await db
        .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image

        })
        .from(user)
        .innerJoin(classes, eq(user.id, classes.teacherId))
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .where(eq(subjects.departmentId, departmentId))

    console.log(departmentUser)
    if (!departmentUser) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: departmentUser });
})



router.get('/:id', async (req, res) => {
    const departmentId = Number(req.params.id);
    console.log('details')
    if (!Number.isFinite(departmentId)) {
        return res.status(400).json({ error: 'Invalid Department ID.' });
    }

    try {
        // 1. Fetch the Department info
        const [departmentInfo] = await db
            .select()
            .from(departments)
            .where(eq(departments.id, departmentId));

        if (!departmentInfo) {
            return res.status(404).json({ error: 'Department not found.' });
        }

        // 2. Fetch the Totals
        // Note: We use subqueries or count logic here
        const [stats] = await db
            .select({
                subjectCount: sql`count(distinct ${subjects.id})`.mapWith(Number),
                classCount: sql`count(distinct ${classes.id})`.mapWith(Number),
                // Assuming you have an enrollment table or a student count column
                studentCount: sql`count(distinct ${enrollments.studentId})`.mapWith(Number),
            })
            .from(subjects)
            .leftJoin(classes, eq(classes.subjectId, subjects.id))
            .leftJoin(enrollments, eq(enrollments.classId, classes.id))
            .where(eq(subjects.departmentId, departmentId));

        // 3. Format the response to match DepartmentDetails type
        const response = {
            department: departmentInfo,
            totals: {
                subjects: stats?.subjectCount || 0,
                classes: stats?.classCount || 0,
                enrolledStudents: stats?.studentCount || 0,
            }
        };
    console.log(response)

        res.status(200).json({ data: response });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});




router.post('/', async (req, res) => {
    try {
        const [createDepartment] = await db
            .insert(departments)
            .values({ ...req.body })
            .returning({ id: departments.id });

        if (!createDepartment) throw Error;

        res.status(201).json({ data: createDepartment });
    } catch (e) {
        console.error(`POST /departments error ${e}`);
        res.status(500).json({ error: e })
    }
})



export default router