import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ChevronDown,
  ChevronRight,
  Mail,
  MailX,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  MessageSquare,
  CalendarDays,
  Send,
  Inbox,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { OutreachRecord } from '@/types';
import { toast } from 'sonner';

const Outreach = () => {
  const outreachRecords = useStore(s => s.outreachRecords);
  const updateOutreachRecord = useStore(s => s.updateOutreachRecord);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<OutreachRecord | null>(null);
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editFollowUpTemplate, setEditFollowUpTemplate] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [emailDetailRecord, setEmailDetailRecord] = useState<OutreachRecord | null>(null);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedIds(next);
  };

  const handleMarkReply = (record: OutreachRecord) => {
    updateOutreachRecord(record.id, {
      replyReceived: true,
      replyReceivedAt: new Date().toISOString(),
    });
    toast.success('Marked as reply received');
  };

  const openFollowUpEditor = (record: OutreachRecord) => {
    setEditingRecord(record);
    setEditFollowUpDate(record.followUpDate || format(new Date(Date.now() + 3 * 86400000), 'yyyy-MM-dd'));
    setEditFollowUpTemplate(record.followUpTemplate || `Hi {{name}},\n\nJust following up on my previous email regarding {{company}}.\n\nWould love to connect when you have a moment.\n\nBest,\n{{sender_name}}`);
    setApplyToAll(false);
  };

  const saveFollowUp = () => {
    if (!editingRecord) return;
    if (applyToAll) {
      outreachRecords
        .filter(r => !r.replyReceived)
        .forEach(r => {
          updateOutreachRecord(r.id, {
            followUpDate: editFollowUpDate,
            followUpTemplate: editFollowUpTemplate,
          });
        });
      toast.success('Follow-up settings applied to all pending records');
    } else {
      updateOutreachRecord(editingRecord.id, {
        followUpDate: editFollowUpDate,
        followUpTemplate: editFollowUpTemplate,
      });
      toast.success('Follow-up updated');
    }
    setEditingRecord(null);
  };

  if (outreachRecords.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <h2 className="text-lg font-semibold text-foreground">No outreach yet</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Companies will appear here after you send emails from the dashboard. Generate leads, enrich contacts, and send emails to get started.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const replied = outreachRecords.filter(r => r.replyReceived);
  const pending = outreachRecords.filter(r => !r.replyReceived);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Outreach Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {outreachRecords.length} companies contacted • {replied.length} replied • {pending.length} awaiting response
            </p>
          </div>
        </div>

        {/* Action Needed - Replied */}
        {replied.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-success" />
              <h2 className="text-sm font-semibold text-foreground">Action Needed ({replied.length})</h2>
            </div>
            {replied.map(record => (
              <OutreachCard
                key={record.id}
                record={record}
                isExpanded={expandedIds.has(record.id)}
                onToggle={() => toggleExpand(record.id)}
                onViewEmail={() => setEmailDetailRecord(record)}
                variant="replied"
              />
            ))}
          </div>
        )}

        {/* Awaiting Response */}
        {pending.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold text-foreground">Awaiting Response ({pending.length})</h2>
            </div>
            {pending.map(record => (
              <OutreachCard
                key={record.id}
                record={record}
                isExpanded={expandedIds.has(record.id)}
                onToggle={() => toggleExpand(record.id)}
                onMarkReply={() => handleMarkReply(record)}
                onEditFollowUp={() => openFollowUpEditor(record)}
                onViewEmail={() => setEmailDetailRecord(record)}
                variant="pending"
              />
            ))}
          </div>
        )}
      </main>

      {/* Follow-up Editor Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Follow-up</DialogTitle>
            <DialogDescription>
              Set the follow-up date and customize the template for {editingRecord?.company.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Follow-up Date</Label>
              <Input
                type="date"
                value={editFollowUpDate}
                onChange={e => setEditFollowUpDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Follow-up Template</Label>
              <Textarea
                value={editFollowUpTemplate}
                onChange={e => setEditFollowUpTemplate(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {['{{name}}', '{{company}}', '{{title}}', '{{sender_name}}'].map(v => (
                  <Badge key={v} variant="secondary" className="text-xs cursor-pointer" onClick={() => setEditFollowUpTemplate(t => t + ' ' + v)}>
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={e => setApplyToAll(e.target.checked)}
                className="rounded border-border"
              />
              Apply these settings to all pending follow-ups
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingRecord(null)}>Cancel</Button>
            <Button size="sm" onClick={saveFollowUp} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Save Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Detail Dialog */}
      <Dialog open={!!emailDetailRecord} onOpenChange={() => setEmailDetailRecord(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Sent to {emailDetailRecord?.company.name}</DialogTitle>
            <DialogDescription>
              Sent {emailDetailRecord?.sentAt ? formatDistanceToNow(new Date(emailDetailRecord.sentAt), { addSuffix: true }) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <p className="text-sm font-medium text-foreground mt-0.5">{emailDetailRecord?.emailSubject}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Body</Label>
              <div className="mt-1 p-3 rounded-md bg-muted text-sm whitespace-pre-wrap text-foreground/80 max-h-64 overflow-y-auto">
                {emailDetailRecord?.emailBody}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Recipients</Label>
              <div className="mt-1 space-y-1">
                {emailDetailRecord?.pocs.map(op => (
                  <div key={op.poc.id} className="flex items-center gap-2 text-sm">
                    {op.emailSent ? (
                      <Mail className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <MailX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-foreground">{op.poc.name}</span>
                    <span className="text-xs text-muted-foreground">{op.poc.email || 'No email'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface OutreachCardProps {
  record: OutreachRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkReply?: () => void;
  onEditFollowUp?: () => void;
  onViewEmail: () => void;
  variant: 'replied' | 'pending';
}

const OutreachCard = ({ record, isExpanded, onToggle, onMarkReply, onEditFollowUp, onViewEmail, variant }: OutreachCardProps) => {
  const sentPocCount = record.pocs.filter(p => p.emailSent).length;

  return (
    <Card className={variant === 'replied' ? 'border-success/30' : ''}>
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{record.company.name}</span>
            <Badge variant={record.company.segment === 'Enterprise' ? 'default' : 'secondary'} className="text-xs">
              {record.company.segment}
            </Badge>
            {variant === 'replied' ? (
              <Badge className="text-xs bg-success/10 text-success border-success/20 hover:bg-success/10">
                <MessageSquare className="h-3 w-3 mr-1" /> Reply Received
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-warning border-warning/30">
                <Clock className="h-3 w-3 mr-1" /> Awaiting Reply
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {sentPocCount} emails sent • {record.company.location} • Sent {formatDistanceToNow(new Date(record.sentAt), { addSuffix: true })}
            {record.followUpDate && !record.replyReceived && (
              <span className="ml-2">• Follow-up: {format(new Date(record.followUpDate), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border">
          {/* POC list */}
          <div className="px-4 py-2 bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground mb-1">POCs ({record.pocs.length})</div>
            {record.pocs.map(op => (
              <div key={op.poc.id} className="flex items-center gap-2 py-1.5 pl-4 text-sm">
                {op.emailSent ? (
                  <Mail className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <MailX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-foreground">{op.poc.name}</span>
                <span className="text-xs text-muted-foreground">— {op.poc.title}</span>
                <Badge variant={op.emailSent ? 'default' : 'outline'} className="text-xs ml-auto">
                  {op.emailSent ? 'Email Sent' : 'Not Sent'}
                </Badge>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-t border-border/50">
            <Button variant="outline" size="sm" onClick={onViewEmail}>
              <Mail className="h-3.5 w-3.5 mr-1" /> View Email
            </Button>
            {variant === 'pending' && (
              <>
                <Button variant="outline" size="sm" onClick={onMarkReply} className="text-success border-success/30 hover:bg-success/10">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Reply Received
                </Button>
                <Button variant="outline" size="sm" onClick={onEditFollowUp}>
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> {record.followUpDate ? 'Edit Follow-up' : 'Set Follow-up'}
                </Button>
              </>
            )}
            {variant === 'replied' && (
              <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/10 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" /> Action needed — review and respond
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default Outreach;
