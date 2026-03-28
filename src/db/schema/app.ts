import { relations } from "drizzle-orm";
import { integer,pgTable ,varchar,timestamp} from "drizzle-orm/pg-core";

const timestamps={
    createdAt:timestamp('created_at').defaultNow().notNull(),
    updatedAt:timestamp('updated_at').defaultNow().notNull().$onUpdate(()=>new Date()),
}


// table
export const departments = pgTable('departments',{
    id:integer('id').primaryKey().generatedAlwaysAsIdentity(),//auto increment but only postgress can do it, so super secure unlike orm of laravel where you can mess with it
    code: varchar('code',{length:50}).notNull().unique(),
    name: varchar('name',{length:100}).notNull(),
    description: varchar('description',{length:255}),
    ...timestamps
})


export const subjects = pgTable('subjects',{
    id:integer('id').primaryKey().generatedAlwaysAsIdentity(),//auto increment but only postgress can do it, so super secure unlike orm of laravel where you can mess with it
    departmentId:integer('department_id').notNull().references(()=>departments.id,{onDelete:'restrict'}),
    code: varchar('code',{length:50}).notNull().unique(),
    name: varchar('name',{length:100}).notNull(),
    description: varchar('description',{length:255}),
    ...timestamps
})

// relations

// one to many relation, unlike laravel where relation is in model here, relation is define here
export const departmentRelations=relations(departments,({many})=>({subjects:many(subjects)}))

//this is like the belongs to, like in departmentRelation its hasMany and in subjectsRelation its belongsTo 
//also this means that subjects is the one that hold the foreign key
export const subjectsRelations=relations(subjects,({one,many})=>({department:one(departments,{
    fields:[subjects.departmentId],
    references:[departments.id]
})}))


// understand this
export type Department= typeof departments.$inferSelect
export type NewDepartment= typeof departments.$inferInsert


// 03:14
export type Subject= typeof subjects.$inferSelect
export type NewSubject= typeof subjects.$inferInsert
