import { useOutletContext } from 'react-router-dom';
import { Coffee, Heart, Users, Clock, MapPin, Phone, Mail } from 'lucide-react';

interface OutletCtx {
  companyName: string;
  company?: {
    about_story?: string | null;
    values_text?: string | null;
    opening_hours?: { weekdays?: string; saturday?: string; sunday?: string } | null;
    location?: string | null;
    phone?: string | null;
    contact_email?: string | null;
  };
}

const DEFAULT_STORY =
  'Welcome to our restaurant. We are passionate about serving great food in a warm, welcoming environment. Each dish is prepared with care using fresh, quality ingredients — we hope you enjoy every bite.';

const CustomerAbout = () => {
  const { companyName, company } = useOutletContext<OutletCtx>();
  const story = company?.about_story?.trim() || DEFAULT_STORY;
  const hours = company?.opening_hours || {};
  const valuesText = company?.values_text?.trim();
  const valuesList = valuesText
    ? valuesText.split(/[•,;|\n]+/).map(s => s.trim()).filter(Boolean)
    : ['Authenticity', 'Community', 'Quality', 'Freshness'];

  const valueIcons = [Heart, Users, Coffee, Clock];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-2">About {companyName}</h1>
      <p className="text-muted-foreground mb-8">Cafe and Restaurant</p>

      <div className="max-w-3xl mx-auto space-y-12">
        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Our Story</h2>
          {story.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mt-4 first:mt-0 whitespace-pre-line">{para}</p>
          ))}
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-6">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {valuesList.slice(0, 4).map((title, i) => {
              const Icon = valueIcons[i % valueIcons.length];
              return (
                <div key={title + i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Opening Hours</h2>
          <div className="bg-card rounded-lg p-6 shadow-card space-y-2 text-sm">
            <div className="flex justify-between"><span>Monday – Friday</span><span className="font-medium">{hours.weekdays || '7:00 AM – 10:00 PM'}</span></div>
            <div className="flex justify-between"><span>Saturday</span><span className="font-medium">{hours.saturday || '8:00 AM – 11:00 PM'}</span></div>
            <div className="flex justify-between"><span>Sunday</span><span className="font-medium">{hours.sunday || '8:00 AM – 9:00 PM'}</span></div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Find Us</h2>
          <div className="bg-card rounded-lg p-6 shadow-card space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>{company?.location || '123 in front of Poly Campus, Bahir Dar, Ethiopia'}</span>
            </div>
            {company?.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <a href={`tel:${company.phone}`} className="hover:text-primary">{company.phone}</a>
              </div>
            )}
            {company?.contact_email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <a href={`mailto:${company.contact_email}`} className="hover:text-primary">{company.contact_email}</a>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerAbout;
