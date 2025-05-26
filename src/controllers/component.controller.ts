import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ComponentWithSpecs } from '../types/component.types';

const prisma = new PrismaClient();

export const componentController = {
  // Get all components with optional filtering
  async getAllComponents(req: Request, res: Response) {
    try {
      const { category, brand, inStock, minPrice, maxPrice } = req.query;
      
      const where: any = {
        ...(category && { category: category as string }),
        ...(brand && { brand: brand as string }),
        ...(inStock && { inStock: inStock === 'true' }),
        ...(minPrice || maxPrice) && {
          price: {
            ...(minPrice && { gte: parseFloat(minPrice as string) }),
            ...(maxPrice && { lte: parseFloat(maxPrice as string) }),
          },
        },
      };

      const components = await prisma.component.findMany({
        where,
        include: {
          cpu: true,
          gpu: true,
          motherboard: true,
          ram: true,
          storage: true,
          psu: true,
          pcCase: true,
          cooling: true,
        },
      });

      res.json(components);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch components' });
    }
  },

  // Get component by ID
  async getComponentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const component = await prisma.component.findUnique({
        where: { id },
        include: {
          cpu: true,
          gpu: true,
          motherboard: true,
          ram: true,
          storage: true,
          psu: true,
          pcCase: true,
          cooling: true,
        },
      });

      if (!component) {
        return res.status(404).json({ error: 'Component not found' });
      }

      res.json(component);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch component' });
    }
  },

  // Create new component
  async createComponent(req: Request, res: Response) {
    try {
      const componentData: ComponentWithSpecs = req.body;
      
      const component = await prisma.component.create({
        data: {
          name: componentData.name,
          brand: componentData.brand,
          model: componentData.model,
          category: componentData.category,
          price: componentData.price,
          currency: componentData.currency,
          description: componentData.description,
          inStock: componentData.inStock,
          popularity: componentData.popularity,
          images: componentData.images,
          ...(componentData.category === 'CPU' && {
            cpu: {
              create: (componentData as any).cpu,
            },
          }),
          ...(componentData.category === 'GPU' && {
            gpu: {
              create: (componentData as any).gpu,
            },
          }),
          // Add similar conditions for other component types
        },
        include: {
          cpu: true,
          gpu: true,
          motherboard: true,
          ram: true,
          storage: true,
          psu: true,
          pcCase: true,
          cooling: true,
        },
      });

      res.status(201).json(component);
    } catch (error) {
      console.error('Error creating component:', error);
      res.status(500).json({ error: 'Failed to create component' });
    }
  },

  // Update component
  async updateComponent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const componentData: Partial<ComponentWithSpecs> = req.body;

      const component = await prisma.component.update({
        where: { id },
        data: {
          ...(componentData.name && { name: componentData.name }),
          ...(componentData.brand && { brand: componentData.brand }),
          ...(componentData.model && { model: componentData.model }),
          ...(componentData.price && { price: componentData.price }),
          ...(componentData.description && { description: componentData.description }),
          ...(componentData.inStock !== undefined && { inStock: componentData.inStock }),
          ...(componentData.images && { images: componentData.images }),
        },
        include: {
          cpu: true,
          gpu: true,
          motherboard: true,
          ram: true,
          storage: true,
          psu: true,
          pcCase: true,
          cooling: true,
        },
      });

      res.json(component);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update component' });
    }
  },

  // Delete component
  async deleteComponent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.component.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete component' });
    }
  },
}; 