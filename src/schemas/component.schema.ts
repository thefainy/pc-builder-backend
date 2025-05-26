import { z } from 'zod';

// Base component schema
export const baseComponentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  category: z.enum(['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLING', 'PERIPHERALS']),
  price: z.number().positive('Price must be positive'),
  currency: z.string().default('KZT'),
  description: z.string().optional(),
  inStock: z.boolean().default(true),
  images: z.array(z.string().url('Invalid image URL')),
});

// CPU schema
export const cpuSchema = baseComponentSchema.extend({
  category: z.literal('CPU'),
  cpu: z.object({
    socket: z.string(),
    cores: z.number().int().positive(),
    threads: z.number().int().positive(),
    baseSpeed: z.number().positive(),
    boostSpeed: z.number().positive(),
    tdp: z.number().int().positive(),
    architecture: z.string(),
    integratedGpu: z.boolean(),
  }),
});

// GPU schema
export const gpuSchema = baseComponentSchema.extend({
  category: z.literal('GPU'),
  gpu: z.object({
    chipset: z.string(),
    vram: z.number().int().positive(),
    vramType: z.string(),
    coreClock: z.number().int().positive(),
    boostClock: z.number().int().positive(),
    tdp: z.number().int().positive(),
    length: z.number().int().positive(),
    ports: z.object({
      hdmi: z.number().int().nonnegative(),
      displayPort: z.number().int().nonnegative(),
    }),
  }),
});

// Motherboard schema
export const motherboardSchema = baseComponentSchema.extend({
  category: z.literal('MOTHERBOARD'),
  motherboard: z.object({
    socket: z.string(),
    chipset: z.string(),
    formFactor: z.string(),
    memoryType: z.string(),
    memorySlots: z.number().int().positive(),
    maxMemory: z.number().int().positive(),
    pciSlots: z.object({
      pcie_x16: z.number().int().nonnegative(),
      pcie_x8: z.number().int().nonnegative(),
      pcie_x4: z.number().int().nonnegative(),
      pcie_x1: z.number().int().nonnegative(),
    }),
    sataSlots: z.number().int().nonnegative(),
    m2Slots: z.number().int().nonnegative(),
  }),
});

// RAM schema
export const ramSchema = baseComponentSchema.extend({
  category: z.literal('RAM'),
  ram: z.object({
    type: z.string(),
    capacity: z.number().int().positive(),
    speed: z.number().int().positive(),
    modules: z.number().int().positive(),
    timing: z.string(),
    voltage: z.number().positive(),
  }),
});

// Storage schema
export const storageSchema = baseComponentSchema.extend({
  category: z.literal('STORAGE'),
  storage: z.object({
    type: z.string(),
    capacity: z.number().int().positive(),
    formFactor: z.string(),
    interface: z.string(),
    readSpeed: z.number().int().positive(),
    writeSpeed: z.number().int().positive(),
    cache: z.number().int().positive().optional(),
  }),
});

// PSU schema
export const psuSchema = baseComponentSchema.extend({
  category: z.literal('PSU'),
  psu: z.object({
    wattage: z.number().int().positive(),
    efficiency: z.string(),
    modular: z.string(),
    formFactor: z.string(),
  }),
});

// Case schema
export const caseSchema = baseComponentSchema.extend({
  category: z.literal('CASE'),
  pcCase: z.object({
    type: z.string(),
    formFactor: z.array(z.string()),
    dimensions: z.object({
      height: z.number().positive(),
      width: z.number().positive(),
      depth: z.number().positive(),
    }),
    maxGpuLength: z.number().int().positive(),
    maxCpuHeight: z.number().int().positive(),
    psuFormFactor: z.array(z.string()),
    fans: z.object({
      included: z.number().int().nonnegative(),
      max: z.number().int().positive(),
    }),
  }),
});

// Cooling schema
export const coolingSchema = baseComponentSchema.extend({
  category: z.literal('COOLING'),
  cooling: z.object({
    type: z.string(),
    size: z.number().int().positive(),
    tdp: z.number().int().positive(),
    noise: z.number().int().nonnegative(),
    sockets: z.array(z.string()),
  }),
});

// Combined schema for all component types
export const componentSchema = z.discriminatedUnion('category', [
  cpuSchema,
  gpuSchema,
  motherboardSchema,
  ramSchema,
  storageSchema,
  psuSchema,
  caseSchema,
  coolingSchema,
]); 