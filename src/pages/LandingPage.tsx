import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QrCode, Clock, ShieldCheck, ChartBar as BarChart3, Smartphone, Utensils, ChefHat, Building2, CreditCard, Megaphone, TrendingUp, Star, Menu as MenuIcon, X, Check, ArrowRight, Play, Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    restaurant_name: '', owner_name: '', email: '', phone: '',
    branch_count: '1', preferred_plan: 'basic', notes: '',
  });

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('company_requests' as any).insert(form as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectPlan = (plan: string) => {
    setForm(f => ({ ...f, preferred_plan: plan }));
    scrollTo(formRef);
  };

  const benefits = [
    { icon: Clock, title: 'Increase Table Turnover', desc: 'QR ordering reduces wait time; customers pay via CBE/Telebirr.' },
    { icon: ShieldCheck, title: 'Reduce Order Errors', desc: 'Orders go directly to the kitchen dashboard — no miscommunication.' },
    { icon: Building2, title: 'Multi-Branch Management', desc: 'Manage all outlets from one account with consolidated analytics.' },
    { icon: BarChart3, title: 'Real-Time Insights', desc: 'Know best-selling items, peak hours, and revenue trends instantly.' },
    { icon: Smartphone, title: 'No Hardware Needed', desc: 'Fully cloud-based, works on existing phones, tablets, and PCs.' },
  ];

  const steps = [
    { num: '1', title: 'Sign Up', desc: 'Choose a plan and set up your restaurant profile.' },
    { num: '2', title: 'Customise', desc: 'Upload your menu, set prices, and configure promotions.' },
    { num: '3', title: 'Go Live', desc: 'Print QR codes — customers start ordering immediately.' },
  ];

  const features = [
    { icon: QrCode, title: 'QR Code Ordering' },
    { icon: ChefHat, title: 'Real-Time Kitchen Dashboard' },
    { icon: Building2, title: 'Multi-Branch Support' },
    { icon: CreditCard, title: 'CBE & Telebirr Integration' },
    { icon: Megaphone, title: 'Promotions Engine' },
    { icon: TrendingUp, title: 'Analytics & Reports' },
  ];

  const plans = [
    { name: 'Basic', price: '500 ETB/mo', features: ['1 branch', 'Up to 100 orders/month', 'Basic analytics', 'Email support'], key: 'basic' },
    { name: 'Standard', price: '1,500 ETB/mo', features: ['Up to 5 branches', 'Unlimited orders', 'Advanced analytics', 'Promotions engine', 'Priority support'], key: 'standard', popular: true },
    { name: 'Premium', price: '3,000 ETB/mo', features: ['Unlimited branches', 'Dedicated account manager', 'Custom branding', 'API access', 'Phone support'], key: 'premium' },
  ];

  const testimonials = [
    { name: 'Abebe Kebede', restaurant: 'Habesha Kitchen', rating: 5, quote: 'Alyah Menu transformed how we take orders. Our table turnover increased by 40% in just two months!' },
    { name: 'Sara Tesfaye', restaurant: 'Lalibela Café', rating: 5, quote: 'The real-time dashboard means our kitchen never misses an order. Our customer satisfaction scores are at an all-time high.' },
    { name: 'Daniel Mekonen', restaurant: 'Blue Nile Restaurant', rating: 4, quote: 'Managing 3 branches from one dashboard saves me hours every week. The analytics help me make smarter decisions.' },
  ];

  const faqs = [
    { q: 'Do I need to buy hardware?', a: 'No! Alyah Menu works on any device with a web browser — phones, tablets, or computers you already own.' },
    { q: 'Can I change plans later?', a: 'Yes. You can upgrade or downgrade your plan anytime from your dashboard. Changes take effect on your next billing cycle.' },
    { q: 'How do QR codes work?', a: 'Each table gets a unique QR code. Customers scan it with their phone camera, view the menu, and place orders directly — no app download needed.' },
    { q: 'Is there a setup fee?', a: 'No setup fee. You only pay the monthly subscription. We even help you configure your first menu for free.' },
    { q: 'What payment methods do you support?', a: 'Customers can pay via CBE (Commercial Bank of Ethiopia), Telebirr, or cash. We\'re adding more payment options soon.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-primary">Alyah Menu</span>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo(featuresRef)} className="text-sm text-muted-foreground hover:text-foreground transition">Features</button>
            <button onClick={() => scrollTo(pricingRef)} className="text-sm text-muted-foreground hover:text-foreground transition">Pricing</button>
            <button onClick={() => scrollTo(contactRef)} className="text-sm text-muted-foreground hover:text-foreground transition">Contact</button>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button size="sm" onClick={() => scrollTo(formRef)}>Request Access</Button>
          </nav>
          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2">
            <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left text-sm py-2">Features</button>
            <button onClick={() => scrollTo(pricingRef)} className="block w-full text-left text-sm py-2">Pricing</button>
            <button onClick={() => scrollTo(contactRef)} className="block w-full text-left text-sm py-2">Contact</button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => { setMobileMenu(false); navigate('/login'); }}>Login</Button>
            <Button size="sm" className="w-full" onClick={() => scrollTo(formRef)}>Request Access</Button>
          </div>
        )}
      </header>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Authentic Ethiopian restaurant interior with traditional dishes"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" />
        <div className="relative py-20 sm:py-32 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6 drop-shadow-lg">
            Transform Your Restaurant with a <span className="text-orange-300">Smart Digital Menu</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-100 max-w-2xl mx-auto mb-10 drop-shadow">
            Increase table turnover, reduce order errors, and get real-time analytics — all in one SaaS platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" onClick={() => scrollTo(formRef)}>
              Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white/40 hover:bg-white/20 hover:text-white" onClick={() => setVideoModal(true)}>
              <Play className="mr-2 h-4 w-4" /> Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={videoModal} onOpenChange={setVideoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>See Alyah Menu in Action</DialogTitle></DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Demo video coming soon</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-12">Why Restaurants Love Alyah Menu</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(b => (
              <Card key={b.title} className="shadow-card border-0">
                <CardContent className="p-6">
                  <b.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-12">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map(s => (
            <div key={s.num} className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">{s.num}</div>
              <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section ref={featuresRef} className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <Card key={f.title} className="shadow-card border-0">
                <CardContent className="p-6 text-center">
                  <f.icon className="h-8 w-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-4">Simple, Transparent Pricing</h2>
        <p className="text-muted-foreground text-center mb-12">Choose the plan that fits your restaurant</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map(p => (
            <Card key={p.key} className={`shadow-card border-0 relative ${p.popular ? 'ring-2 ring-primary' : ''}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">Most Popular</div>}
              <CardHeader className="text-center">
                <CardTitle className="font-display text-xl">{p.name}</CardTitle>
                <p className="text-2xl font-bold text-primary mt-2">{p.price}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-accent shrink-0" /> {f}</li>
                  ))}
                </ul>
                <Button className="w-full" variant={p.popular ? 'default' : 'outline'} onClick={() => selectPlan(p.key)}>Choose {p.name}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Registration Form */}
      <section ref={formRef} className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-4">Request Access</h2>
          <p className="text-muted-foreground text-center mb-8">Fill in your details and our team will get back to you</p>
          {submitted ? (
            <Card className="shadow-card border-0">
              <CardContent className="p-8 text-center">
                <Check className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">Request Submitted!</h3>
                <p className="text-muted-foreground text-sm">Your request has been sent to Alyah Menu administrators. You will receive login credentials via email once approved.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card border-0">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>Restaurant Name *</Label><Input value={form.restaurant_name} onChange={e => setForm(f => ({ ...f, restaurant_name: e.target.value }))} required /></div>
                  <div><Label>Owner Full Name *</Label><Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                    <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Number of Branches</Label>
                      <Select value={form.branch_count} onValueChange={v => setForm(f => ({ ...f, branch_count: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2-5">2–5</SelectItem>
                          <SelectItem value="6+">6+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Preferred Plan</Label>
                      <Select value={form.preferred_plan} onValueChange={v => setForm(f => ({ ...f, preferred_plan: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Additional Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
                  <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-12">What Our Clients Say</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <Card key={t.name} className="shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.restaurant}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border-0 shadow-card px-4">
                <AccordionTrigger className="text-sm font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer ref={contactRef} className="py-12 px-4 sm:px-6 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-4 gap-8">
          <div>
            <span className="font-display text-lg font-bold text-orange-300">Alyah Menu</span>
            <p className="text-sm mt-2 text-gray-400">Smart digital menu platform for Ethiopian restaurants.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <button onClick={() => scrollTo(featuresRef)} className="block text-gray-400 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollTo(pricingRef)} className="block text-gray-400 hover:text-white transition-colors">Pricing</button>
              <button onClick={() => scrollTo(formRef)} className="block text-gray-400 hover:text-white transition-colors">Request Access</button>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">Legal</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Privacy Policy</p>
              <p>Terms of Service</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">Contact</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@alyahmenu.com</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> +251 911 123 456</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Addis Ababa, Ethiopia</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Alyah Menu. All rights reserved.</span>
          <div className="flex gap-3">
            <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-orange-300 hover:text-gray-900 flex items-center justify-center transition-colors"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-orange-300 hover:text-gray-900 flex items-center justify-center transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-orange-300 hover:text-gray-900 flex items-center justify-center transition-colors"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
