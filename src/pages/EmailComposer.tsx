import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Search, Send, Loader2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { EmailTemplate } from '@/types';

const TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial',
    name: 'Initial Outreach',
    subject: "Transform {{company}}'s L&D program",
    body: `Hi {{name}},

I noticed {{company}} is doing great work in the industry. As the {{title}}, I'm sure you're always looking for ways to upskill your workforce.

Our LMS platform helps companies like yours streamline training, improve compliance, and boost employee engagement.

Would you be open to a quick 15-minute call this week?

Best regards,
{{sender_name}}
{{sender_phone}}`,
  },
  {
    id: 'followup1',
    name: 'Follow-up 1',
    subject: 'Quick follow-up — {{company}} L&D',
    body: `Hi {{name}},

I wanted to follow up on my previous email about how Skillbetter can help {{company}} with training and development.

We've helped similar companies reduce training costs by 40% while improving completion rates.

Would love to share a quick demo. When works best for you?

Best,
{{sender_name}}
{{sender_phone}}`,
  },
  {
    id: 'followup2',
    name: 'Follow-up 2',
    subject: 'Last touch — {{company}}',
    body: `Hi {{name}},

I understand you're busy at {{company}}. Just wanted to share a quick case study that might be relevant.

If now isn't the right time, no worries — I'll check back in a few months.

Best,
{{sender_name}}
{{sender_phone}}`,
  },
];

const EmailComposer = () => {
  const navigate = useNavigate();
  const companies = useStore(s => s.companies);
  const emailPocIds = useStore(s => s.emailPocIds);

  const allPocs = companies.flatMap(c => c.pocs);
  const enrichedPocs = allPocs.filter(p => emailPocIds.includes(p.id) && p.enrichment_status === 'enriched' && (p.preferred_email || p.email));
  const notEnrichedPocs = allPocs.filter(p => emailPocIds.includes(p.id) && (!p.preferred_email && !p.email || p.enrichment_status !== 'enriched'));

  const [selectedTemplate, setSelectedTemplate] = useState<string>('initial');
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const t = TEMPLATES.find(t => t.id === templateId);
    if (t) { setSubject(t.subject); setBody(t.body); }
  };

  const previewPoc = enrichedPocs[previewIndex];
  const previewCompany = previewPoc ? companies.find(c => c.pocs.some(p => p.id === previewPoc.id)) : null;

  const replaceVars = (text: string) => {
    if (!previewPoc || !previewCompany) return text;
    return text
      .replace(/\{\{name\}\}/g, previewPoc.name.split(' ')[0])
      .replace(/\{\{company\}\}/g, previewCompany.name)
      .replace(/\{\{title\}\}/g, previewPoc.title)
      .replace(/\{\{sender_name\}\}/g, 'Hardik Goel')
      .replace(/\{\{sender_phone\}\}/g, '+91 8005652382');
  };

  const handleSend = async () => {
    if (enrichedPocs.length === 0) return;
    setIsSending(true);
    try {
      const res = await api.post<{ sent_count: number; failed_count: number }>('/api/emails/bulk-send', {
        poc_ids: enrichedPocs.map(p => p.id),
        subject,
        body,
        template_variables: { sender_name: 'Hardik Goel', sender_phone: '+91 8005652382' },
      });

      // Group POCs by company and create outreach records
      const companyMap = new Map<string, typeof companies[0]>();
      const allSelectedPocs = allPocs.filter(p => emailPocIds.includes(p.id));
      allSelectedPocs.forEach(poc => {
        const comp = companies.find(c => c.pocs.some(pp => pp.id === poc.id));
        if (comp && !companyMap.has(comp.id)) companyMap.set(comp.id, comp);
      });

      const addOutreachRecord = useStore.getState().addOutreachRecord;
      const removeCompaniesFromLeads = useStore.getState().removeCompaniesFromLeads;
      const companyIds: string[] = [];

      companyMap.forEach(comp => {
        const compPocs = allSelectedPocs.filter(p => comp.pocs.some(pp => pp.id === p.id));
        const outreachPocs = comp.pocs.map(poc => ({
          poc,
          emailSent: compPocs.some(cp => cp.id === poc.id && poc.enrichment_status === 'enriched'),
          sentAt: new Date().toISOString(),
        }));

        const replaceVarsForPoc = (text: string, poc: typeof comp.pocs[0]) => {
          return text
            .replace(/\{\{name\}\}/g, poc.name.split(' ')[0])
            .replace(/\{\{company\}\}/g, comp.name)
            .replace(/\{\{title\}\}/g, poc.title)
            .replace(/\{\{sender_name\}\}/g, 'Hardik Goel')
            .replace(/\{\{sender_phone\}\}/g, '+91 8005652382');
        };

        const firstEnrichedPoc = compPocs.find(p => p.enrichment_status === 'enriched') || compPocs[0];

        addOutreachRecord({
          id: crypto.randomUUID(),
          company: comp,
          pocs: outreachPocs,
          emailSubject: replaceVarsForPoc(subject, firstEnrichedPoc),
          emailBody: replaceVarsForPoc(body, firstEnrichedPoc),
          sentAt: new Date().toISOString(),
          replyReceived: false,
          followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        });
        companyIds.push(comp.id);
      });

      removeCompaniesFromLeads(companyIds);

      toast.success(`Sent ${res.sent_count} emails successfully!`);
      navigate('/outreach');
    } catch {
      toast.error('Failed to send emails.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Compose Emails</h1>
        </div>

        {/* Recipients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-foreground">Recipients ({enrichedPocs.length} enriched POCs)</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {enrichedPocs.map(p => {
                  const comp = companies.find(c => c.pocs.some(pp => pp.id === p.id));
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground text-xs">({comp?.name})</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {notEnrichedPocs.length > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 text-warning" /> Not Included ({notEnrichedPocs.length} not enriched)
                </h3>
                <div className="space-y-1 max-h-24 overflow-y-auto text-sm text-muted-foreground">
                  {notEnrichedPocs.slice(0, 3).map(p => (
                    <div key={p.id}>{p.name} — Not enriched</div>
                  ))}
                  {notEnrichedPocs.length > 3 && <div>+{notEnrichedPocs.length - 3} more...</div>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Editor + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Compose Pane */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">COMPOSE</h3>
              <div className="space-y-2">
                <Label className="text-xs">Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Body</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} rows={14} className="font-mono text-sm" />
              </div>
              <div className="flex flex-wrap gap-1">
                {['{{name}}', '{{company}}', '{{title}}', '{{sender_name}}', '{{sender_phone}}'].map(v => (
                  <Badge key={v} variant="secondary" className="text-xs cursor-pointer" onClick={() => setBody(b => b + ' ' + v)}>
                    {v}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview Pane */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">PREVIEW</h3>
                {enrichedPocs.length > 1 && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewIndex(i => Math.max(0, i - 1))} disabled={previewIndex === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{previewIndex + 1}/{enrichedPocs.length}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewIndex(i => Math.min(enrichedPocs.length - 1, i + 1))} disabled={previewIndex === enrichedPocs.length - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {previewPoc ? (
                <div className="space-y-3 text-sm">
                  <div className="text-muted-foreground text-xs">To: {previewPoc.email}</div>
                  <div className="font-semibold text-foreground">{replaceVars(subject)}</div>
                  <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed border-t border-border pt-3">
                    {replaceVars(body)}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No enriched POCs to preview</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Send Controls */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" /> Save as Draft
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSend}
            disabled={isSending || enrichedPocs.length === 0}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Send to All ({enrichedPocs.length})
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EmailComposer;
