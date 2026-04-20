export const roleOptions = ["Admin", "Finance", "Support"] as const;

export const requestTypeFilters = ["All", "Access", "Capacity", "Finance"] as const;

export const requestStatusFilters = ["All", "Pending", "Approved", "Rejected"] as const;

export const incidentActions = [
  {
    buttonLabel: "Freeze privileged writes",
    confirmLabel: "Freeze writes",
    hoverDescription:
      "Pause sensitive admin mutations until the incident is contained.",
    tone: "destructive" as const,
    successLabel: "Emergency freeze enabled",
    successDescription: "Privileged mutations are now paused.",
  },
  {
    buttonLabel: "Create incident",
    confirmLabel: "Create incident",
    hoverDescription:
      "Open a new incident record so the team can track and respond to the issue.",
    tone: "outline" as const,
    successLabel: "Incident created",
    successDescription: "A new incident was opened for the admin team.",
  },
  {
    buttonLabel: "Security report",
    confirmLabel: "Export report",
    hoverDescription:
      "Download a snapshot of current security posture, controls, and audit health.",
    tone: "outline" as const,
    successLabel: "Security report exported",
    successDescription: "The current security posture has been downloaded.",
  },
] as const;
