import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ComponentWithSpecs } from '../types/component.types';

const prisma = new PrismaClient();

export const componentController = {
  // Get all components with optional filtering
  async getAllComponents(req: Request, res: Response): Promise<Response> {
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
        // Убираем include с несуществующими полями
        // Используем только основные поля компонента
      });

      return res.json(components);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch components' });
    }
  },

  // Get component by ID
  async getComponentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const component = await prisma.component.findUnique({
        where: { id },
        // Убираем include с несуществующими полями
      });

      if (!component) {
        return res.status(404).json({ error: 'Component not found' });
      }

      return res.json(component);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch component' });
    }
  },

  // Create new component
  async createComponent(req: Request, res: Response): Promise<Response> {
    try {
      const componentData: ComponentWithSpecs = req.body;

      const component = await prisma.component.create({
        data: {
          name: componentData.name,
          brand: componentData.brand,
          model: componentData.model,
          category: componentData.category,
          price: componentData.price,
          currency: componentData.currency || 'KZT',
          description: componentData.description,
          inStock: componentData.inStock ?? true,
          popularity: componentData.popularity || 0,
          images: componentData.images || [],
          specs: componentData.specs || {},
          features: componentData.features || [],
          rating: componentData.rating || 0,
        },
        // Убираем include с несуществующими полями
      });

      return res.status(201).json(component);
    } catch (error) {
      console.error('Error creating component:', error);
      return res.status(500).json({ error: 'Failed to create component' });
    }
  },

  // Update component
  async updateComponent(req: Request, res: Response): Promise<Response> {
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
          ...(componentData.specs && { specs: componentData.specs }),
          ...(componentData.features && { features: componentData.features }),
          updatedAt: new Date(),
        },
        // Убираем include с несуществующими полями
      });

      return res.json(component);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update component' });
    }
  },

  // Delete component
  async deleteComponent(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await prisma.component.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete component' });
    }
  },
};
