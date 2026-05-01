import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail, Clock } from 'lucide-react';

interface Props {
  companyId: string;
  branchId: string;
  tableNumber: number;
  companyName: string;
  phone?: string | null;
  location?: string | null;
  email?: string | null;
  openingHours?: { weekdays?: string; saturday?: string; sunday?: string } | null;
  openingHoursText?: string | null;
  aboutText?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialLinkedin?: string | null;
}

const CustomerFooter = ({
  companyId, branchId, tableNumber, companyName, phone, location, email,
  openingHours, openingHoursText, aboutText,
  socialFacebook, socialInstagram, socialLinkedin,
}: Props) => {
  const baseUrl = `/b/${companyId}/${branchId}`;
  const tableSuffix = `?table=${tableNumber}`;
  const hours = openingHours || {};

  const heading = 'font-display text-base font-semibold text-white mb-4 pb-2 border-b border-gray-700';
  const link = 'text-gray-300 hover:text-white transition-colors text-sm';
  const social =
    'h-9 w-9 rounded-full bg-gray-800 hover:bg-primary text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200';

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
          {/* Brand */}
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-2">{companyName}</h3>
            <p className="text-sm text-gray-300 mb-4">{aboutText || 'Authentic flavors, served with love.'}</p>
            <div className="flex gap-3 justify-center md:justify-start">
              {socialFacebook && <a href={socialFacebook} target="_blank" rel="noreferrer" aria-label="Facebook" className={social}><Facebook className="h-4 w-4" /></a>}
              {socialInstagram && <a href={socialInstagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={social}><Instagram className="h-4 w-4" /></a>}
              {socialLinkedin && <a href={socialLinkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className={social}><Linkedin className="h-4 w-4" /></a>}
              {!socialFacebook && !socialInstagram && !socialLinkedin && (
                <>
                  <a href="#" aria-label="Facebook" className={social}><Facebook className="h-4 w-4" /></a>
                  <a href="#" aria-label="Instagram" className={social}><Instagram className="h-4 w-4" /></a>
                  <a href="#" aria-label="LinkedIn" className={social}><Linkedin className="h-4 w-4" /></a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={heading}>Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to={`${baseUrl}${tableSuffix}`} className={link}>Home</Link></li>
              <li><Link to={`${baseUrl}/menu${tableSuffix}`} className={link}>Menu</Link></li>
              <li><Link to={`${baseUrl}/promotions${tableSuffix}`} className={link}>Promotions</Link></li>
              <li><Link to={`${baseUrl}/about${tableSuffix}`} className={link}>About</Link></li>
              <li><Link to={`${baseUrl}/contact${tableSuffix}`} className={link}>Contact</Link></li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className={heading}>Opening Hours</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2 justify-center md:justify-start">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                {openingHoursText ? (
                  <p className="text-white">{openingHoursText}</p>
                ) : (
                  <div>
                    <p>Mon – Thu: <span className="text-white">{hours.weekdays || '11AM – 10PM'}</span></p>
                    <p>Fri – Sat: <span className="text-white">{hours.saturday || '11AM – 11PM'}</span></p>
                    <p>Sunday: <span className="text-white">{hours.sunday || '10AM – 9PM'}</span></p>
                  </div>
                )}
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={heading}>Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 justify-center md:justify-start">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{location || '123 in front of Poly Campus, Bahir Dar'}</span>
              </li>
              {phone && (
                <li className="flex items-start gap-2 justify-center md:justify-start">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <a href={`tel:${phone}`} className={link}>{phone}</a>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2 justify-center md:justify-start">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <a href={`mailto:${email}`} className={link}>{email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <span>Powered by Alyah Menu</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
