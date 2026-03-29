import { and, desc, eq, getTableColumns, ilike, notIlike, or, sql } from "drizzle-orm";
import express from "express"
import { departments, subjects } from "../db/schema";
import { db } from "../db";
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


export default router