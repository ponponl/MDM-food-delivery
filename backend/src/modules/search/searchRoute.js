import express from 'express';
import { searchAll } from './search.controller.js';

const router = express.Router();

router.get('/', searchAll);

export default router;