import express from 'express';
import { smartSearch } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', smartSearch);

export default router;
