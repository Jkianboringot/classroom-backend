import { NextFunction, Request, Response } from "express";
import aj from '../config/arcjet'
import { ArcjetNodeRequest, slidingWindow } from "@arcjet/node";
const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next() //if in testing skip

    try {
        const role: RateLimitRole = req.user?.role ?? 'guest'

        let limit: number;
        let message: string;

        switch (role) {
            case 'admin':
                limit = 20;
                message = 'Admin request limit exceeded (20 per minute). Slow down.';
                break;

            case 'teacher':
                limit = 15;
                message = 'Teacher request limit exceeded (15 per minute). Slow down.';
                break;

            case 'student':
                limit = 10;
                message = 'Student request limit exceeded (10 per minute). Slow down.';
                break;

            default:
                limit = 5;
                message = 'Request limit exceeded (5 per minute).Please sign up for more limits.';
        }


        const client = aj.withRule(slidingWindow({
            mode: 'LIVE'
            , interval: '1m',
            max: limit
        }))


        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.originalUrl ?? req.url,
            socket: { remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0' }
        }

        const decision = await client.protect(arcjetRequest)

        //code rabbit suggested that i either make the message same as the one in switch case or include what is in the switch case
        //but the problem with that is, this check is for everyone, in switch case it is for specific user, 

        //ohh ok am dumn in switch is all about rate limit so i should just use what is the define message thier am stupid the more you know
        if (decision.isDenied() && decision.reason.isRateLimit()) {
            return res.status(429).json({
                error: 'rate_limit_exceeded',
                message: 'Automated request are not allowed'
            });
        }

        if (decision.isDenied() && decision.reason.isBot()) {
            return res.status(403).json({
                error: 'bot_detected',
                message: 'Bot activity detected. Access denied.'
            });
        }

        if (decision.isDenied() && decision.reason.isShield()) {
            return res.status(403).json({
                error: 'shield_blocked',
                message: 'Request blocked by security shield.'
            });
        }

        // fallback
        if (decision.isDenied()) {
            return res.status(403).json({
                error: 'access_denied',
                message: 'Request denied.'
            });
        }

        next()

    } catch (e) {
        console.error('Arcjet middleware error:', e)
        res.status(500).json({ error: 'Internal error', message: 'Something went wrong with security middleware' })
    }
}


export default securityMiddleware