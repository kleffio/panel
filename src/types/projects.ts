export type ProjectsDashboardPageData = {
  projects: Array<{
    id: string;
    name: string;
    status: "healthy" | "warning" | "error";
    region: string;
    servicesCount: number;
    aiSummary: string;
    href: string;
  }>;
};
