export interface User {
  email: string;
  name: string;
}

export interface CTA {
  id: string;
  label: string;
  segment: 'SME' | 'Enterprise' | 'Both';
  icon: string;
  description: string;
}

export interface OrgConfig {
  ctas: CTA[];
}

export type OrgStatus = 'active' | 'archived';

export interface Org {
  id: string;
  name: string;
  subtitle: string;
  status?: OrgStatus;
  config: OrgConfig;
}

export type EnrichmentStatus = 'not_enriched' | 'enriched' | 'failed' | 'pending' | 'no_contact';

export interface POC {
  id: string;
  name: string;
  title: string;
  department?: string;
  email?: string;
  phone?: string;
  emails?: string[];
  phones?: string[];
  preferred_email?: string;
  preferred_phone?: string;
  linkedin_url?: string;
  enrichment_status: EnrichmentStatus;
  enrichment_error?: string;
  company_id: string;
}

export interface Company {
  id: string;
  name: string;
  segment: 'SME' | 'Enterprise';
  location: string;
  employee_count: number;
  industry: string;
  generated_at: string;
  pocs: POC[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface GenerationRequest {
  org_id: string;
  segment: string;
  company_count: number;
  pocs_per_company: number;
}

export interface EnrichmentResult {
  poc_id: string;
  success: boolean;
  email?: string;
  phone?: string;
}

export interface EnrichmentResponse {
  success: boolean;
  enriched_count: number;
  failed_count: number;
  credits_used: number;
  results: EnrichmentResult[];
}

export interface OutreachPoc {
  poc: POC;
  emailSent: boolean;
  sentAt?: string;
}

export interface OutreachRecord {
  id: string;
  company: Company;
  pocs: OutreachPoc[];
  emailSubject: string;
  emailBody: string;
  sentAt: string;
  replyReceived: boolean;
  replyReceivedAt?: string;
  followUpDate?: string;
  followUpTemplate?: string;
  notes?: string;
}
