export const Roles = {
    EMPLOYEE: "employee",
    MANAGER: "manager"
} as const;

export type Roles = typeof Roles[keyof typeof Roles];