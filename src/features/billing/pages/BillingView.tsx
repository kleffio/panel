"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kleffio/ui";
import { PlanBadge } from "@/features/billing/ui/PlanBadge";
import { formatCents, formatDate, INVOICE_STATUS_STYLES } from "@/features/billing/lib/utils";
import { MOCK_SUBSCRIPTION, MOCK_INVOICES } from "@/features/billing/model/mock";

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
            <Button variant="outline" size="sm">
              Upgrade Plan
            </Button>
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
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${
                        INVOICE_STATUS_STYLES[inv.status] ?? ""
                      }`}
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
