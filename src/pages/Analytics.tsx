import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Users, Mail, MessageSquare, MailCheck, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/stores/useStore";
import Header from "@/components/layout/Header";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { MetricCard } from "@/components/analytics/MetricCard";
import { OutreachPieChart } from "@/components/analytics/OutreachPieChart";
import { OutreachBarChart } from "@/components/analytics/OutreachBarChart";
import { OutreachTable } from "@/components/analytics/OutreachTable";

const Analytics = () => {
  const outreachRecords = useStore(s => s.outreachRecords);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const filtered = useMemo(() => {
    if (!dateRange?.from) return outreachRecords;
    const from = dateRange.from;
    const to = dateRange.to ?? dateRange.from;
    return outreachRecords.filter((record) => {
      const sent = new Date(record.sentAt);
      return sent >= from && sent <= new Date(to.getTime() + 86400000 - 1);
    });
  }, [outreachRecords, dateRange]);

  const totalCompanies = filtered.length;
  const totalEmailsSent = filtered.reduce((sum, r) => sum + r.pocs.filter(p => p.emailSent).length, 0);
  const replies = filtered.filter(r => r.replyReceived).length;
  const followUps = filtered.filter(r => r.followUpDate && !r.replyReceived).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Sub-header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-xl bg-accent shadow-md">
                <BarChart3 className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">Track your outreach and email performance</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {outreachRecords.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
              <h2 className="text-lg font-semibold text-foreground">No outreach data yet</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Send emails from the Leads page to start seeing analytics here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Companies" value={totalCompanies} icon={Users} index={0} />
              <MetricCard title="Emails Sent" value={totalEmailsSent} icon={Mail} index={1} />
              <MetricCard title="Replies" value={replies} icon={MessageSquare} index={2} />
              <MetricCard title="Follow-ups" value={followUps} icon={MailCheck} index={3} />
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <OutreachPieChart records={filtered} />
              <OutreachBarChart records={filtered} />
            </div>

            <OutreachTable records={filtered} />
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
