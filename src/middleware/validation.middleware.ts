import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  schema
    .parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    })
    .then(() => {
      next();
    })
    .catch((error) => {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
}; 