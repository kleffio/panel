"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@kleffio/ui";
import { Badge } from "@kleffio/ui";
import { Button } from "@kleffio/ui";
import { Separator } from "@kleffio/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kleffio/ui";
import { PlanBadge } from "@/components/domain/PlanBadge";
import type { Invoice, Subscription } from "@/types";

// TODO: replace with useQuery
const MOCK_SUBSCRIPTION: Subscription = {
  id: "sub-001",
  organizationId: "org-001",
  plan: {
    id: "plan-business",
    tier: "business",
    name: "Business",
    description: "For serious hosting operations",
    pricePerMonth: 149,
    pricePerYear: 1490,
    features: ["Up to 20 game servers", "Priority support", "Custom domains", "Advanced analytics", "DDoS protection"],
    maxGameServers: 20,
    maxTeamMembers: 15,
    supportLevel: "priority",
    isPopular: true,
  },
  status: "active",
  interval: "monthly",
  currentPeriodStart: "2025-03-01T00:00:00Z",
  currentPeriodEnd: "2025-04-01T00:00:00Z",
  cancelAtPeriodEnd: false,
  createdAt: "2024-11-01T00:00:00Z",
  updatedAt: "2025-03-01T00:00:00Z",
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-003", organizationId: "org-001", subscriptionId: "sub-001",
    status: "paid", number: "INV-2025-003",
    lines: [{ id: "li-1", description: "Business Plan — March 2025", quantity: 1, unitAmount: 14900, totalAmount: 14900 }],
    subtotal: 14900, tax: 1937, total: 16837, currency: "usd",
    paidAt: "2025-03-01T10:00:00Z", createdAt: "2025-03-01T00:00:00Z",
  },
  {
    id: "inv-002", organizationId: "org-001", subscriptionId: "sub-001",
    status: "paid", number: "INV-2025-002",
    lines: [{ id: "li-2", description: "Business Plan — February 2025", quantity: 1, unitAmount: 14900, totalAmount: 14900 }],
    subtotal: 14900, tax: 1937, total: 16837, currency: "usd",
    paidAt: "2025-02-01T10:00:00Z", createdAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "inv-001", organizationId: "org-001", subscriptionId: "sub-001",
    status: "open", number: "INV-2025-001",
    lines: [{ id: "li-3", description: "Business Plan — January 2025", quantity: 1, unitAmount: 14900, totalAmount: 14900 }],
    subtotal: 14900, tax: 1937, total: 16837, currency: "usd",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  open: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  void: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
  draft: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

export function BillingView() {
  const sub = MOCK_SUBSCRIPTION;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and invoices.</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>{sub.plan.description}</CardDescription>
            </div>
            <PlanBadge tier={sub.plan.tier} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Status</span>
              <span className="ml-2 font-medium capitalize text-emerald-400">{sub.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Billing</span>
              <span className="ml-2 font-medium capitalize">{sub.interval}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Next renewal</span>
              <span className="ml-2 font-medium">{formatDate(sub.currentPeriodEnd)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Price</span>
              <span className="ml-2 font-medium">
                {formatCents(sub.plan.pricePerMonth * 100)}/mo
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            {sub.plan.features.map((f) => (
              <Badge key={f} variant="secondary" className="text-xs">
                {f}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Upgrade Plan</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Download or view past invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_INVOICES.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(inv.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCents(inv.total, inv.currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${INVOICE_STATUS_STYLES[inv.status] ?? ""}`}
                    >
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="xs">
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
