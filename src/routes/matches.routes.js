import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validations/matches.js";
import {db} from '../config/db.js'
import { matches } from "../config/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get('/', async(req,res) => {

    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if(!parsed.success){
        return res.status(400).json({
            error: 'Invalid Query.', details: JSON.stringify(parsed.error.issues)
        });
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT)

    try {
        const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit);

        res.status(200).json({
            data,
            message: "Fetched Successfully...."
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to list matches.' })
    }

    res.status(200).json({
        message: "Matches List"
    })
});

matchRouter.post('/', async (req,res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    
    if(!parsed.success){
        return res.status(400).json({
            error: 'Invalid payload.', details: JSON.stringify(parsed.error.issues)
        });
    }

    const { data: { startTime, endTime, homeScore, awayScore } } = parsed;
    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(parsed.data.startTime),
            endTime: new Date(parsed.data.endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime,endTime)
        }).returning();

        res.status(201).json({ data: event })
    } catch (error) {
        console.log("error",error)
        res.status(500).json({ error: 'Failed to create match.', details: JSON.stringify(error)});    }
});