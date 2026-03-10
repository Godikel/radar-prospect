import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { OutreachRecord } from "@/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl">
        <p className="font-semibold mb-2 text-foreground">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 py-0.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface Props {
  records: OutreachRecord[];
}

export function OutreachBarChart({ records }: Props) {
  // Group by company segment
  const segmentMap = new Map<string, { sent: number; replied: number; pending: number }>();

  for (const record of records) {
    const segment = record.company.segment;
    const entry = segmentMap.get(segment) || { sent: 0, replied: 0, pending: 0 };
    const emailsSent = record.pocs.filter(p => p.emailSent).length;
    entry.sent += emailsSent;
    if (record.replyReceived) entry.replied++;
    else entry.pending++;
    segmentMap.set(segment, entry);
  }

  const data = Array.from(segmentMap.entries())
    .map(([segment, stats]) => ({
      name: segment,
      "Emails Sent": stats.sent,
      Replied: stats.replied,
      Pending: stats.pending,
    }));

  if (data.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Outreach by Segment</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Outreach by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Emails Sent" fill="hsl(213, 80%, 57%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Replied" fill="hsl(142, 53%, 41%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pending" fill="hsl(45, 100%, 52%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
