import { useOutletContext, Link } from 'react-router-dom';
import { ArrowRight, Star, Coffee, Utensils, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import heroBg from '@/assets/hero-bg.jpg';

interface OutletCtx {
  companyId: string;
  branchId: string;
  tableNumber: number;
}

const CustomerHome = () => {
  const { companyId, branchId, tableNumber } = useOutletContext<OutletCtx>();
  const base = `/b/${companyId}/${branchId}`;
  const tp = `?table=${tableNumber}`;

  const { data: promotions } = useQuery({
    queryKey: ['promotions', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .limit(3);
      return data || [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="Canoe Ethiopian Café" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
        <div className="relative z-10 text-center px-4 max-w-2xl animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mb-4">
            Welcome to Canoe
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-2">Cafe and Restaurant</p>
          <p className="text-primary-foreground/70 mb-8">Table {tableNumber} • Authentic flavors of Ethiopia</p>
          <Link to={`${base}/menu${tp}`}>
            <Button size="lg" className="bg-hero-gradient text-primary-foreground shadow-warm hover:opacity-90 transition-opacity">
              View Our Menu <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Promotions */}
      {promotions && promotions.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-display font-bold text-center mb-8">Featured Promotions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {promotions.map(p => (
              <Card key={p.id} className="shadow-card hover:shadow-warm transition-shadow border-0 bg-card">
                <CardContent className="p-6">
                  <div className="bg-hero-gradient text-primary-foreground text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
                    {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` :
                     p.discount_type === 'bogo' ? 'BOGO' : `${p.discount_value} ETB OFF`}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="bg-secondary/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Why Choose Canoe</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Utensils, title: 'Authentic Recipes', desc: 'Traditional Ethiopian dishes prepared with love and authentic spices' },
              { icon: Coffee, title: 'Coffee Ceremony', desc: 'Experience the traditional Ethiopian coffee ceremony' },
              { icon: Clock, title: 'Fresh & Fast', desc: 'Freshly prepared meals served promptly to your table' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 rounded-full bg-hero-gradient flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerHome;
