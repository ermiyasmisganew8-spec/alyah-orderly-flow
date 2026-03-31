import { Coffee, Heart, Users, Clock } from 'lucide-react';

const CustomerAbout = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-2">About Canoe</h1>
      <p className="text-muted-foreground mb-8">Ethiopian Café</p>

      <div className="max-w-3xl mx-auto space-y-12">
        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            Canoe Ethiopian Café was born from a deep love for authentic Ethiopian cuisine and the desire to share it
            with the vibrant community of Bahir Dar. Named after the traditional canoes that gracefully navigate
            Lake Tana, our café embodies the spirit of Ethiopian hospitality — warm, welcoming, and full of flavor.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Every dish we serve is prepared with traditional recipes passed down through generations, using the
            freshest local ingredients and authentic spice blends imported from the highlands of Ethiopia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-6">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Heart, title: 'Authenticity', desc: 'Genuine Ethiopian recipes and traditions' },
              { icon: Users, title: 'Community', desc: 'A gathering place for friends and family' },
              { icon: Coffee, title: 'Quality', desc: 'Only the finest ingredients and spices' },
              { icon: Clock, title: 'Freshness', desc: 'Everything prepared fresh, daily' },
            ].map(v => (
              <div key={v.title} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Opening Hours</h2>
          <div className="bg-card rounded-lg p-6 shadow-card space-y-2 text-sm">
            <div className="flex justify-between"><span>Monday – Friday</span><span className="font-medium">7:00 AM – 10:00 PM</span></div>
            <div className="flex justify-between"><span>Saturday</span><span className="font-medium">8:00 AM – 11:00 PM</span></div>
            <div className="flex justify-between"><span>Sunday</span><span className="font-medium">8:00 AM – 9:00 PM</span></div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Location</h2>
          <p className="text-muted-foreground">123 in front of Poly Campus, Bahir Dar, Ethiopia</p>
        </section>
      </div>
    </div>
  );
};

export default CustomerAbout;
