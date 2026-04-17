"use client";

import { BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@kleffio/ui";

const deploymentChartData = [
  { day: "Mon", deployments: 4 },
  { day: "Tue", deployments: 7 },
  { day: "Wed", deployments: 3 },
  { day: "Thu", deployments: 9 },
  { day: "Fri", deployments: 6 },
  { day: "Sat", deployments: 2 },
  { day: "Sun", deployments: 1 },
];

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Your infrastructure at a glance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deployments — last 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deploymentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Bar dataKey="deployments" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
