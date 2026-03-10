import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BarChart3, MessageSquare, Clock, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { OutreachRecord } from "@/types";

interface Props {
  records: OutreachRecord[];
}

export function OutreachTable({ records }: Props) {
  if (records.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Outreach Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Outreach Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Company</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">POCs</TableHead>
                <TableHead className="text-right">Emails Sent</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, index) => {
                const emailsSent = record.pocs.filter(p => p.emailSent).length;
                return (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                    className="border-border/30 hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">{record.company.name}</p>
                        <p className="text-xs text-muted-foreground">{record.company.industry} • {record.company.location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.company.segment === 'Enterprise' ? 'default' : 'secondary'} className="text-xs">
                        {record.company.segment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{record.pocs.length}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{emailsSent}</TableCell>
                    <TableCell className="text-center">
                      {record.replyReceived ? (
                        <Badge className="text-xs bg-success/10 text-success border-success/20 hover:bg-success/10">
                          <MessageSquare className="h-3 w-3 mr-1" /> Replied
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-warning border-warning/30">
                          <Clock className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(record.sentAt), { addSuffix: true })}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
