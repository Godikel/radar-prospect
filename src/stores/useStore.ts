import { create } from 'zustand';
import type { Org, Company, User, OutreachRecord, OutreachPoc } from '@/types';

interface Store {
  user: User | null;
  login: (email: string) => boolean;
  logout: () => void;

  orgs: Org[];
  setOrgs: (orgs: Org[]) => void;
  selectedOrg: Org | null;
  setSelectedOrg: (org: Org) => void;

  companies: Company[];
  setCompanies: (companies: Company[]) => void;
  updateCompanyPocs: (companyId: string, updates: Partial<Company['pocs'][0]>[]) => void;

  selectedPocIds: Set<string>;
  togglePoc: (pocId: string) => void;
  selectCompanyPocs: (companyId: string) => void;
  clearSelection: () => void;

  expandedCompanies: Set<string>;
  toggleCompanyExpand: (companyId: string) => void;

  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  isEnriching: boolean;
  setIsEnriching: (v: boolean) => void;

  // Email composer state
  emailPocIds: string[];
  setEmailPocIds: (ids: string[]) => void;

  // Outreach tracking
  outreachRecords: OutreachRecord[];
  addOutreachRecord: (record: OutreachRecord) => void;
  updateOutreachRecord: (id: string, updates: Partial<OutreachRecord>) => void;
  removeCompaniesFromLeads: (companyIds: string[]) => void;
}

export const useStore = create<Store>((set, get) => ({
  user: null,
  login: (email: string) => {
    if (email === 'hardik.goel@skillbetter.co.in') {
      set({ user: { email, name: 'Hardik Goel' } });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null }),

  orgs: [],
  setOrgs: (orgs) => set({ orgs }),
  selectedOrg: null,
  setSelectedOrg: (org) => set({ selectedOrg: org, companies: [], selectedPocIds: new Set(), expandedCompanies: new Set() }),

  companies: [],
  setCompanies: (companies) => set({ companies }),
  updateCompanyPocs: (companyId, updates) => {
    const companies = get().companies.map(c => {
      if (c.id !== companyId) return c;
      return {
        ...c,
        pocs: c.pocs.map(p => {
          const update = updates.find(u => u.id === p.id);
          return update ? { ...p, ...update } : p;
        })
      };
    });
    set({ companies });
  },

  selectedPocIds: new Set(),
  togglePoc: (pocId) => {
    const selected = new Set(get().selectedPocIds);
    if (selected.has(pocId)) selected.delete(pocId);
    else selected.add(pocId);
    set({ selectedPocIds: selected });
  },
  selectCompanyPocs: (companyId) => {
    const company = get().companies.find(c => c.id === companyId);
    if (!company) return;
    const pocIds = company.pocs.map(p => p.id);
    const allSelected = pocIds.every(id => get().selectedPocIds.has(id));
    const selected = new Set(get().selectedPocIds);
    pocIds.forEach(id => { if (allSelected) selected.delete(id); else selected.add(id); });
    set({ selectedPocIds: selected });
  },
  clearSelection: () => set({ selectedPocIds: new Set() }),

  expandedCompanies: new Set(),
  toggleCompanyExpand: (companyId) => {
    const expanded = new Set(get().expandedCompanies);
    if (expanded.has(companyId)) expanded.delete(companyId);
    else expanded.add(companyId);
    set({ expandedCompanies: expanded });
  },

  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
  isEnriching: false,
  setIsEnriching: (v) => set({ isEnriching: v }),

  emailPocIds: [],
  setEmailPocIds: (ids) => set({ emailPocIds: ids }),

  outreachRecords: [],
  addOutreachRecord: (record) => set({ outreachRecords: [...get().outreachRecords, record] }),
  updateOutreachRecord: (id, updates) => {
    set({
      outreachRecords: get().outreachRecords.map(r => r.id === id ? { ...r, ...updates } : r)
    });
  },
  removeCompaniesFromLeads: (companyIds) => {
    set({ companies: get().companies.filter(c => !companyIds.includes(c.id)) });
  },
}));
