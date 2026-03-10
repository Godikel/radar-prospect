import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  index?: number;
}

export function MetricCard({ title, value, icon: Icon, description, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden relative group hover:scale-[1.02] transition-transform duration-300 border-border/50 bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="absolute inset-0 opacity-[0.04] bg-gradient-to-br from-accent to-primary" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-accent shadow-md">
              <Icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          </div>
          <div className="space-y-1">
            <motion.p
              className="text-3xl font-bold tracking-tight text-foreground"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: index * 0.1 + 0.2 }}
            >
              {value.toLocaleString()}
            </motion.p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
