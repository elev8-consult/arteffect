import type { Access } from "payload";

type UserWithRole = {
  id?: number | string;
  role?: "admin" | "editor" | "customer" | null;
};

export function isAdmin(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  return (user as UserWithRole).role === "admin";
}

export function isEditor(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  return (user as UserWithRole).role === "editor";
}

export function canManageContent(user: unknown): boolean {
  return isAdmin(user) || isEditor(user);
}

export const anyone: Access = () => true;

export const authenticated: Access = ({ req: { user } }) => isAdmin(user);

export const authenticatedAdmin = ({ req: { user } }: Parameters<NonNullable<Access>>[0]) =>
  isAdmin(user);

export const editorOrAdmin = ({ req: { user } }: Parameters<NonNullable<Access>>[0]) =>
  canManageContent(user);

export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (canManageContent(user)) {
    return true;
  }

  return {
    isPublished: {
      equals: true
    }
  };
};

export const firstUserOrAuthenticated: Access = async ({ req }) => {
  if (isAdmin(req.user)) {
    return true;
  }

  const { totalDocs } = await req.payload.count({
    collection: "users"
  });

  return totalDocs === 0;
};

export const adminOrSelf: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true;
  if (!user?.id) return false;

  return {
    id: {
      equals: user.id
    }
  };
};

export const adminOrCustomer: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true;
  if (!user?.id) return false;

  return {
    customer: {
      equals: user.id
    }
  };
};

export const noOne: Access = () => false;
