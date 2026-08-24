/**
 * User Login DTO Schema (Zod)
 * Task: BE-028 (Implement Login API)
 * SRS Traceability: FR-01 (Authentication), NFR-06 (Usability)
 */

import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'email is required',
    })
    .email('Invalid email address format'),
  password: z
    .string({
      required_error: 'password is required',
    })
    .min(1, 'password cannot be empty'),
})
