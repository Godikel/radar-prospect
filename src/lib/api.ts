import type { Org, Company, GenerationRequest, EnrichmentResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = 'https://leadgen-backend-production-4e93.up.railway.app/api';

function parseWorkforceSize(size?: string): number {
  if (!size) return 0;
  const match = size.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function mapCompany(raw: any): Company {
  return {
    id: String(raw.id),
    name: raw.company_name ?? raw.name ?? 'Unknown',
    segment: raw.segment ?? 'SME',
    location: raw.geography ?? raw.location ?? 'Unknown',
    employee_count: raw.employee_count ?? parseWorkforceSize(raw.workforce_size),
    industry: raw.industry ?? raw.sub_industry ?? 'Unknown',
    generated_at: raw.created_at ?? raw.generated_at ?? new Date().toISOString(),
    pocs: (raw.pocs ?? []).map((p: any) => {
      const enrichmentError = p.enrichment_error ?? null;
      const isEnriched = !!p.enriched;
      const isFailed = !!p.enrichment_failed;
      const isNoContact = enrichmentError?.includes('No contact information found');
      const isPending = enrichmentError?.includes('Pending:');

      let enrichment_status: string;
      if (isEnriched) enrichment_status = 'enriched';
      else if (isNoContact) enrichment_status = 'no_contact';
      else if (isFailed) enrichment_status = 'failed';
      else if (isPending) enrichment_status = 'pending';
      else enrichment_status = 'not_enriched';

      return {
        id: String(p.id),
        name: p.poc_name ?? p.name ?? 'Unknown',
        title: p.poc_title ?? p.title ?? '',
        department: p.poc_department ?? p.department,
        email: p.preferred_email ?? p.email,
        phone: p.preferred_phone ?? p.phone,
        emails: p.emails ?? (p.email ? [p.email] : []),
        phones: p.phones ?? (p.phone ? [p.phone] : []),
        preferred_email: p.preferred_email ?? p.email,
        preferred_phone: p.preferred_phone ?? p.phone,
        linkedin_url: p.poc_linkedin ?? p.linkedin_url,
        enrichment_status,
        enrichment_error: enrichmentError,
        company_id: String(raw.id),
      };
    }),
  };
}

class APIClient {
  private getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      // Try refreshing the token once
      const refreshed = await useAuthStore.getState().refreshSession();
      if (refreshed) {
        const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            ...this.getAuthHeaders(),
            ...options?.headers,
          },
        });
        if (retryRes.ok) return retryRes.json();
      }
      // Refresh failed — logout and redirect
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }
    return res.json();
  }

  // GET /api/orgs
  getOrgs(): Promise<Org[]> {
    return this.request<Org[]>('/orgs');
  }

  // GET /api/orgs/:id
  getOrgById(id: string): Promise<Org> {
    return this.request<Org>(`/orgs/${id}`);
  }

  // GET /api/orgs/:id/companies?include_pocs=true
  async getOrgCompanies(id: string): Promise<{ companies: Company[] }> {
    const res = await this.request<{ companies: any[] }>(`/orgs/${id}/companies?include_pocs=true`);
    console.log('Raw companies response:', res);
    const companies = (res?.companies ?? []).map(mapCompany);
    return { companies };
  }

  // GET /api/orgs/:id/stats
  getOrgStats(id: string): Promise<any> {
    return this.request<any>(`/orgs/${id}/stats`);
  }

  // POST /api/pocs/enrich
  enrichPOCs(pocIds: string[]): Promise<EnrichmentResponse> {
    return this.request<EnrichmentResponse>('/pocs/enrich', {
      method: 'POST',
      body: JSON.stringify({ poc_ids: pocIds }),
    });
  }

  // POST /api/emails/bulk-send
  sendBulkEmails(data: { poc_ids: string[]; subject: string; body: string; template_variables: Record<string, string> }): Promise<{ sent_count: number; failed_count: number }> {
    return this.request('/emails/bulk-send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // POST /api/pocs/:id/set-preferred
  setPreferred(pocId: string, type: 'email' | 'phone', value: string): Promise<{ success: boolean }> {
    const payload = type === 'email' ? { preferred_email: value } : { preferred_phone: value };
    return this.request(`/pocs/${pocId}/set-preferred`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // POST /api/generate/full-pipeline
  generateLeads(data: GenerationRequest): Promise<{ success: boolean; stats: { companies: number; pocs: number }; companies: Company[] }> {
    return this.request<{ success: boolean; stats: { companies: number; pocs: number }; companies: any[] }>('/generate/full-pipeline', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint.replace(/^\/api/, ''));
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint.replace(/^\/api/, ''), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint.replace(/^\/api/, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint.replace(/^\/api/, ''), {
      method: 'DELETE',
    });
  }
}

export const api = new APIClient();
