import { and, desc, eq, getTableColumns, ilike, notIlike, or, sql } from "drizzle-orm";
import express from "express"
import { classes, departments, enrollments, subjects, user } from "../db/schema/index.js";
import { db } from "../db/index.js";
const router = express.Router()

//get all subject with search and filtering
router.get('/', async (req, res) => {
    try {

        //this are the request query, meaning you can use what is in here to do
        // -http://localhost:8000/api/subjects?department=Mathematics
        // -http://localhost:8000/api/subjects?search=Mechanics
        // so its pretty being able to control what you see using url qeury, and i believe this is faster 
        //then livewire laravel becuase in livewire, you have to hit model and controller then get back to
        //view, in here browser kinda do all that
        // client-driven URL query search/filter vs server-driven Livewire-style search/filter
        const { search, department, page = 1, limit = 10 } = req.query

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100);

        const offset = (currentPage - 1) * limitPerPage

        const filterConditions = []

        //if search query exist, filter by subject or subject code
        if (search) {
            //will do it like this `${search}%`, becuase i will index it later
            filterConditions.push(
                or(
                    ilike(subjects.name, `${search}%`),
                    ilike(subjects.code, `${search}%`)
                ))
        }


        //if department exist, match by department
        if (department) {
            //will do it like this `${search}%`, becuase i will index it later
            //- code rabbit suggested removing this because const depPattern do it but that is just for escaping not filtering, i dot know
            //-so i will not change that and keep it as is becuase i think its correct
            // filterConditions.push(
            //     ilike(departments.name, `${department}%`));

            //     this is for sql-injection, but this is not the best its better to use something like prepare on sql
            // also other framework has this on default, but you should learn and still do this, becuase you can learn monitorEventLoopDelay
            // and become more aware of why is it important and how to spot this problem early, and solve it
            const depPattern = `%${String(department).replace(/[%_]/g, `\\$&`)}%`;
            filterConditions.push(ilike(departments.name, depPattern))
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)


        const totalCount = Number(countResult[0]?.count ?? 0)

        const subjectsList = await db.select({
            ...getTableColumns(subjects),
            department: { ...getTableColumns(departments) }
        }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset)

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })

    } catch (error) {
        console.error(`Get /subjects error: ${error}`)
        res.status(500).json({ error: 'Failed to get subjects' })
    }
})

router.get('/:id', async (req, res) => {
    const subjectId = Number(req.params.id);
    if (!Number.isFinite(subjectId)) {
        return res.status(400).json({ error: 'Invalid Department ID.' });
    }

    try {
        // 1. Fetch the Department info
        const [subjectInfo] = await db
            .select()
            .from(subjects)
            .where(eq(subjects.id, subjectId));

        if (!subjectInfo) {
            return res.status(404).json({ error: 'Department not found.' });
        }

        // 2. Fetch the Totals
        // Note: We use subqueries or count logic here
        const [stats] = await db
            .select({
                classCount: sql`count(distinct ${classes.id})`.mapWith(Number),
            })
            .from(subjects)
            .leftJoin(classes, eq(subjects.id, classes.subjectId))
            .where(eq(subjects.id, subjectId));

        // 3. Format the response to match DepartmentDetails type
        const response = {
            subject: subjectInfo,
            totals: {
                classes: stats?.classCount || 0,
            }
        };

        res.status(200).json({ data: response });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});




// type SubjectClass = {
//   id: classes.id
//   name: classes.name
//   status: classes.status
//   capacity: classes.capacity
//   teacher?: {
//     id:teacher.id
//     name: teacher.name
//     email:teacher.email
//     image:teacher.image
//   } | null;
// };

router.get('/:id/classes', async (req, res) => {
    const subjectId = Number(req.params.id);


    if (!Number.isFinite(subjectId)) return res.status(400).json({ error: 'No Class found.' });
    console.log(subjectId)

    const subjectClasses = await db
        .select({
            id: classes.id,
            name: classes.name,
            status: classes.status,
            capacity: classes.capacity,
            teacher: {
                ...getTableColumns(user),
            }
        })
        .from(subjects)
        .innerJoin(classes, eq(subjects.id, classes.subjectId))
        .innerJoin(user, eq(classes.teacherId, user.id))
        .where(
            eq(classes.subjectId, subjectId)
        )


    console.log(subjectClasses)
    if (!subjectClasses) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: subjectClasses });
})


// type SubjectUser = {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   image?: string | null;
// };

router.get('/:id/users', async (req, res) => {
    const subjectId = Number(req.params.id);
    const query = req.query.role as "student" | "teacher" | "admin"

    if (!Number.isFinite(subjectId)) return res.status(400).json({ error: 'No Class found.' });
    console.log(subjectId)
    console.log(query)

    const subjectUser = await db
        .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image
        })
        .from(classes)
        .innerJoin(enrollments, eq(classes.id, enrollments.classId))
        .innerJoin(user, eq(enrollments.studentId, user.id))
        .where(and(
            eq(classes.subjectId, subjectId)
            ,eq(user.role,query) //look how vulnerable this shit, that query cam be anything you dont, need to how
            // how to hack something to know that is not good , ofcourse it would be good to be able to hack it so that
            // you see it clearly, but you need to use your head somehting not everything need tobe done that is done,
            // at the end  if it is still nto validate or sanitize enough then be stricter. dont test it rgiht now, unless
            // you really want to
        )
        )
        // let focus on it showing, 

    console.log(subjectUser)
    if (!subjectUser) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: subjectUser });
})

router.post('/', async (req, res) => {
    try {
        const [createSubject] = await db
            .insert(subjects)
            .values({ ...req.body })
            .returning({ id: subjects.id });

        if (!createSubject) throw Error;

        res.status(201).json({ data: createSubject });
    } catch (e) {
        console.error(`POST /subjects error ${e}`);
        res.status(500).json({ error: e })
    }
})




export default router