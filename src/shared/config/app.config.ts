export const appConfig = {
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  companyId: process.env.NEXT_PUBLIC_COMPANY_ID || "",
  catalogId: process.env.NEXT_PUBLIC_CATALOG_ID || "",
} as const;
