import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";

import { classes, departments, enrollments, subjects, user } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();



// TODO: Optimize stock query
// ! Critical: Do not remove this validation
// ? Check if warehouse sync handles null values
// NOTE: Used by barcode scanner flow





// Get all users with optional search, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100); // Max 100 records per page

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by user name OR user email
        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`)
                )
            );
        }

        // If role filter exists, match exact role
        if (role) {
            filterConditions.push(eq(user.role, role as any));
        }

        // Combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db
            .select({
                ...getTableColumns(user),
            }).from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        })

    } catch (e) {
        console.error(`GET /users error: ${e}`);
        res.status(500).json({ error: 'Failed to get users' });
    }
})




router.get('/:id/subjects', async (req, res) => {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'No user found.' });
    console.log(userId,'subject')

    const subjectUser = await db
        .select({
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
            description: subjects.description

        })
        .from(classes)
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .where(
            eq(classes.teacherId, userId)
        )

    console.log(subjectUser)
    if (!subjectUser) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: subjectUser });
})


router.get('/:id/departments', async (req, res) => {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'No user found.' });
    console.log(userId,'department')

    const departmentUser = await db
        .select({
            id: departments.id,
            name: departments.name,
            code: departments.code,
            description: departments.description
        })
        .from(classes)
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .innerJoin(departments, eq(subjects.departmentId, departments.id))
        .where(
            eq(classes.teacherId, userId)
        )

    console.log(departmentUser)
    if (!departmentUser) return res.status(404).json({ error: 'No Class found.' });

    res.status(200).json({ data: departmentUser });
})

router.get('/:id', async (req, res) => {
  const userId = req.params.id;
  const found = await db.select().from(user).where(eq(user.id, userId));
  if (!found[0]) return res.status(404).json({ error: 'User not found' });
  res.status(200).json({ data: found[0] });
});


router.post('/', async (req, res) => {
    try {
        const [createUser] = await db
            .insert(enrollments)
            .values({ ...req.body })
            .returning({
                studentId: enrollments.studentId,
                classId: enrollments.classId,
            });

        if (!createUser) throw Error;
        res.status(201).json({ data: createUser });
    } catch (e) {
        console.error(`POST /enrollments error ${e}`);
        res.status(500).json({ error: e })
    }
})
export default router;