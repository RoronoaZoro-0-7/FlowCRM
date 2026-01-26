import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        orgId: string;
      };
    }
  }
}

// This is necessary to make this file a module
export {};