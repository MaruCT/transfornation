import express from 'express';
import { getAllProjects, getProjectById, createProject } from '../controllers/projectController.js';

const router = express.Router();

// GET /api/projects - Get all projects with optional filters
router.get('/', getAllProjects);

// GET /api/projects/:id - Get single project by ID or slug
router.get('/:id', getProjectById);

// POST /api/projects - Create new project
router.post('/', createProject);

export default router;
