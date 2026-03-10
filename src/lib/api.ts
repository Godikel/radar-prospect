import type { Org, Company, GenerationRequest, EnrichmentResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Mock data for demo
const MOCK_ORGS: Org[] = [
  {
    id: 'org-1',
    name: 'BetterPlace',
    subtitle: 'LMS Sales',
    config: {
      ctas: [
        { id: 'cta-1', label: 'Generate SME Leads', segment: 'SME', icon: 'building', description: 'Target small & medium enterprises' },
        { id: 'cta-2', label: 'Generate Enterprise Leads', segment: 'Enterprise', icon: 'factory', description: 'Target large enterprises' },
        { id: 'cta-3', label: 'Generate Both', segment: 'Both', icon: 'flame', description: 'Full pipeline generation' },
      ]
    }
  },
  {
    id: 'org-2',
    name: 'TechCorp',
    subtitle: 'HR Tech Solutions',
    config: {
      ctas: [
        { id: 'cta-4', label: 'Generate HR Leads', segment: 'SME', icon: 'building', description: 'Target HR departments' },
        { id: 'cta-5', label: 'Generate Enterprise HR', segment: 'Enterprise', icon: 'factory', description: 'Large enterprise HR teams' },
      ]
    }
  },
  {
    id: 'org-3',
    name: 'RetailCo',
    subtitle: 'Training Platform',
    config: {
      ctas: [
        { id: 'cta-6', label: 'Generate Retail Leads', segment: 'SME', icon: 'building', description: 'Retail chain training teams' },
      ]
    }
  },
];

const MOCK_COMPANIES: Company[] = [
  {
    id: 'comp-1', name: 'TechCorp Solutions', segment: 'SME', location: 'Mumbai',
    employee_count: 245, industry: 'Manufacturing', generated_at: new Date().toISOString(),
    pocs: [
      { id: 'poc-1', name: 'Rajesh Kumar', title: 'L&D Manager', enrichment_status: 'not_enriched', linkedin_url: 'linkedin.com/in/rajesh-kumar', company_id: 'comp-1' },
      { id: 'poc-2', name: 'Priya Sharma', title: 'HR Head', email: 'priya.s@techcorp.com', phone: '+91 98123 45678', enrichment_status: 'enriched', linkedin_url: 'linkedin.com/in/priya-sharma', company_id: 'comp-1' },
      { id: 'poc-3', name: 'Amit Patel', title: 'Training Lead', enrichment_status: 'not_enriched', company_id: 'comp-1' },
      { id: 'poc-4', name: 'Sneha Reddy', title: 'People & Culture', enrichment_status: 'failed', linkedin_url: 'linkedin.com/in/sneha-reddy', company_id: 'comp-1' },
      { id: 'poc-5', name: 'Vikram Singh', title: 'Chief Learning Officer', enrichment_status: 'not_enriched', linkedin_url: 'linkedin.com/in/vikram-singh', company_id: 'comp-1' },
    ]
  },
  {
    id: 'comp-2', name: 'AutoParts Ltd', segment: 'SME', location: 'Pune',
    employee_count: 520, industry: 'Automotive', generated_at: new Date(Date.now() - 86400000).toISOString(),
    pocs: [
      { id: 'poc-6', name: 'Ravi Menon', title: 'HR Director', enrichment_status: 'not_enriched', company_id: 'comp-2' },
      { id: 'poc-7', name: 'Kavita Nair', title: 'Training Manager', enrichment_status: 'not_enriched', company_id: 'comp-2' },
      { id: 'poc-8', name: 'Suresh Iyer', title: 'L&D Specialist', enrichment_status: 'not_enriched', company_id: 'comp-2' },
      { id: 'poc-9', name: 'Anita Desai', title: 'People Ops Lead', enrichment_status: 'not_enriched', company_id: 'comp-2' },
      { id: 'poc-10', name: 'Deepak Joshi', title: 'VP Human Resources', enrichment_status: 'not_enriched', company_id: 'comp-2' },
    ]
  },
  {
    id: 'comp-3', name: 'RetailChain India', segment: 'Enterprise', location: 'Bangalore',
    employee_count: 2400, industry: 'Retail', generated_at: new Date(Date.now() - 172800000).toISOString(),
    pocs: [
      { id: 'poc-11', name: 'Meera Kapoor', title: 'CHRO', email: 'meera.k@retailchain.in', phone: '+91 99887 76655', enrichment_status: 'enriched', company_id: 'comp-3' },
      { id: 'poc-12', name: 'Arjun Rao', title: 'Head of Training', email: 'arjun.r@retailchain.in', phone: '+91 98765 43210', enrichment_status: 'enriched', company_id: 'comp-3' },
      { id: 'poc-13', name: 'Lakshmi Venkat', title: 'L&D Manager', email: 'lakshmi.v@retailchain.in', phone: '+91 91234 56789', enrichment_status: 'enriched', company_id: 'comp-3' },
      { id: 'poc-14', name: 'Nikhil Gupta', title: 'Talent Dev Lead', enrichment_status: 'not_enriched', company_id: 'comp-3' },
      { id: 'poc-15', name: 'Pooja Mehta', title: 'HR Business Partner', enrichment_status: 'not_enriched', company_id: 'comp-3' },
    ]
  },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class APIClient {
  private useMock = !API_BASE_URL;

  async get<T>(endpoint: string): Promise<T> {
    if (this.useMock) return this.mockGet<T>(endpoint);
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    if (this.useMock) return this.mockPost<T>(endpoint, data);
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  private async mockGet<T>(endpoint: string): Promise<T> {
    await delay(600);
    if (endpoint === '/api/orgs') return MOCK_ORGS as T;
    if (endpoint.includes('/companies')) return { companies: MOCK_COMPANIES } as T;
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  private async mockPost<T>(endpoint: string, data: unknown): Promise<T> {
    if (endpoint === '/api/generate/full-pipeline') {
      // Simulate generation with delay
      await delay(3000);
      return { success: true, stats: { companies: 10, pocs: 50 }, companies: MOCK_COMPANIES } as T;
    }
    if (endpoint === '/api/pocs/enrich') {
      const { poc_ids } = data as { poc_ids: string[] };
      const results: EnrichmentResponse = {
        success: true,
        enriched_count: Math.max(1, poc_ids.length - 1),
        failed_count: 1,
        credits_used: poc_ids.length,
        results: poc_ids.map((id, i) => ({
          poc_id: id,
          success: i < poc_ids.length - 1,
          email: i < poc_ids.length - 1 ? `contact${i}@company.com` : undefined,
          phone: i < poc_ids.length - 1 ? `+91 9${Math.floor(Math.random() * 900000000 + 100000000)}` : undefined,
        })),
      };
      return results as T;
    }
    if (endpoint === '/api/emails/bulk-send') {
      await delay(2000);
      const { poc_ids } = data as { poc_ids: string[] };
      return { sent_count: poc_ids.length, failed_count: 0 } as T;
    }
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}

export const api = new APIClient();
