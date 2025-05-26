import { Router } from 'express';
import { componentController } from '../controllers/component.controller';
import { validate } from '../middleware/validation.middleware';
import { componentSchema, baseComponentSchema } from '../schemas/component.schema';
import { z } from 'zod';

const router = Router();

// Validation schemas for query parameters
const getAllComponentsQuerySchema = z.object({
  query: z.object({
    category: z.enum(['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLING', 'PERIPHERALS']).optional(),
    brand: z.string().optional(),
    inStock: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  }),
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});

const createComponentSchema = z.object({ body: componentSchema });
const updateComponentSchema = z.object({
  params: idParamSchema.shape.params,
  body: baseComponentSchema.partial(),
});

// Get all components with optional filtering
router.get('/', validate(getAllComponentsQuerySchema), componentController.getAllComponents);

// Get component by ID
router.get('/:id', validate(idParamSchema), async (req, res, next) => {
  try {
    await componentController.getComponentById(req, res);
  } catch (error) {
    next(error);
  }
});

// Create new component
router.post('/', validate(createComponentSchema), async (req, res, next) => {
  try {
    await componentController.createComponent(req, res);
  } catch (error) {
    next(error);
  }
});

// Update component
router.put('/:id', validate(updateComponentSchema), componentController.updateComponent);

// Delete component
router.delete('/:id', validate(idParamSchema), componentController.deleteComponent);

export default router; 