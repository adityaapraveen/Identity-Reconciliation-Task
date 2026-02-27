import { Request, Response, NextFunction } from "express";
import { z } from 'zod'

const identifySchema = z.object({

    email: z.string().email('Invalid email format').nullable().optional(),
    phoneNumber: z.union([z.string(), z.number()]).transform(val => (val !== null && val !== undefined ? String(val) : val))
        .nullable().optional(),
})
    .refine(
        data => data.email || data.phoneNumber,
        {
            message: 'At least one of email or phoneNumber must be provided'
        }
    )

export type IdentifyInput = z.infer<typeof identifySchema>

export const validateIdentify = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const result = identifySchema.safeParse(req.body)

    if (!result.success) {
        res.status(400)
            .json({
                error: 'validation failed',
                details: result.error.flatten().fieldErrors,
            })
        return


    }

    req.body = result.data
    next()

}