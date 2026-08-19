/**
 * Template DTO (Data Transfer Object) Schema (Zod)
 * Tasks: BE-007 & BE-014
 */

import { z } from 'zod'

export const createTemplateSchema = z.object({
  title: z
    .string({
      required_error: 'title is required',
    })
    .min(3, 'title must be at least 3 characters long'),
})
