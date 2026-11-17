export type DepartmentCode = "RISK_CONTROL" | "OPERATIONS" | "AI" | "SYSTEM" | "CUSTOMER_SERVICE" | "TRADING";

export type RoleCode =
  | "SUPER_ADMIN"
  | "RISK_OWNER"
  | "RISK_ANALYST"
  | "OPS_LEAD"
  | "OPS_ANALYST"
  | "AI_ENGINEER"
  | "SYSTEM_ADMIN"
  | "VIEWER"
  | "PUBLIC_GUEST"
  | "CS_LEAD"
  | "CS_AGENT"
  | "TR_LEAD"
  | "TR_DEALER";

export type SourceCategory =
  | "MARKET_DATA"
  | "NEWS_MACRO"
  | "CRYPTO"
  | "REGULATORY"
  | "INTERNAL_PLATFORM"
  | "LP_LIQUIDITY"
  | "MESSAGING"
  | "REFERENCE";

export type AlertSeverity = "INFO" | "WARN" | "BREACH" | "CRITICAL";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "CLOSED";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role_code: RoleCode;
  department_code: DepartmentCode | null;
  team_id: number | null;
  team_name: string | null;
}
