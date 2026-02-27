import { Router } from 'express'
import { validateIdentify } from '../middleware/validate'
import { identify } from '../controllers/contact.controller'

const router = Router()

router.post('/identify', validateIdentify, identify)

export default router