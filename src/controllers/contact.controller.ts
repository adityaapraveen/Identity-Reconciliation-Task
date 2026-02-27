import {Request, Response, NextFunction} from 'express'
import {ContactService} from '../services/contact.service'

const contactService = new ContactService()

export const identify = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const response = await contactService.identify(req.body)
        res.status(200).json(response)
    } catch (error) {
        next(error)
    }
}