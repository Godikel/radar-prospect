import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/stores/useStore';
import { toast } from 'sonner';
import type { POC } from '@/types';

interface ContactSelectorProps {
  poc: POC;
  type: 'email' | 'phone';
}

const formatPhone = (phone: string) => {
  if (phone.length > 10) return `+${phone.slice(0, 2)} ${phone.slice(2)}`;
  return phone;
};

const ContactSelector = ({ poc, type }: ContactSelectorProps) => {
  const companies = useStore(s => s.companies);
  const setCompanies = useStore(s => s.setCompanies);
  const [open, setOpen] = useState(false);

  const items = type === 'email' ? (poc.emails ?? []) : (poc.phones ?? []);
  const preferred = type === 'email' ? (poc.preferred_email ?? poc.email) : (poc.preferred_phone ?? poc.phone);
  const displayValue = type === 'email' ? preferred : preferred ? formatPhone(preferred) : undefined;
  const Icon = type === 'email' ? Mail : Phone;

  if (!displayValue) return null;

  const handleSetPreferred = async (value: string) => {
    try {
      await api.setPreferred(poc.id, type, value);
      const updatedCompanies = companies.map(c => ({
        ...c,
        pocs: c.pocs.map(p => {
          if (p.id !== poc.id) return p;
          return type === 'email'
            ? { ...p, preferred_email: value, email: value }
            : { ...p, preferred_phone: value, phone: value };
        }),
      }));
      setCompanies(updatedCompanies);
      toast.success(`Preferred ${type} updated`);
      setOpen(false);
    } catch {
      toast.error(`Failed to update preferred ${type}`);
    }
  };

  if (items.length <= 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success">
        <Icon className="h-3 w-3 shrink-0" />
        {displayValue}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-success hover:underline cursor-pointer">
          <Icon className="h-3 w-3 shrink-0" />
          {displayValue}
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-0.5">
            +{items.length - 1}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="text-xs font-medium text-foreground mb-2">
          Select {type === 'email' ? 'Email' : 'Phone'}
        </p>
        <RadioGroup
          value={preferred ?? items[0]}
          onValueChange={handleSetPreferred}
          className="space-y-1.5"
        >
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <RadioGroupItem value={item} id={`${poc.id}-${type}-${idx}`} />
              <Label htmlFor={`${poc.id}-${type}-${idx}`} className="text-xs cursor-pointer font-normal">
                {type === 'phone' ? formatPhone(item) : item}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
};

export default ContactSelector;
