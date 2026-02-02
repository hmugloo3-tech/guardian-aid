import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const footerLinks = {
  platform: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Find Donors", href: "#donors" },
    { label: "Register as Donor", href: "/register-donor" },
  ],
  support: [
    { label: "Help Center", href: "#help" },
    { label: "Emergency Contacts", href: "#emergency" },
    { label: "FAQs", href: "#faqs" },
    { label: "Report Issue", href: "mailto:lifelinekashmir.support@gmail.com" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
    { label: "Data Protection", href: "#data" },
  ],
};

const emergencyContacts = [
  { number: "112", label: "National Emergency Helpline" },
  { number: "108", label: "Ambulance Services" },
  { number: "104", label: "Health Helpline" },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12 lg:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary fill-primary/20" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg leading-tight">LifeLine</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Kashmir</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Kashmir's emergency blood donor platform. Connecting verified donors with those in need, instantly.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="#" icon={Facebook} />
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={Instagram} />
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div>
            <h4 className="font-semibold mb-4">Emergency Contacts</h4>
            <ul className="space-y-3">
              {emergencyContacts.map((contact) => (
                <li key={contact.number}>
                  <a
                    href={`tel:${contact.number}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{contact.number}</span>
                    <span className="text-xs">– {contact.label}</span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="mailto:lifelinekashmir.support@gmail.com"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  lifelinekashmir.support@gmail.com
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Service Area: Jammu & Kashmir, India</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 p-4 bg-muted/50 rounded-xl border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            <strong className="text-foreground">Disclaimer:</strong> Life Line Kashmir is a voluntary blood donation platform. 
            The app does not provide medical advice or emergency services. Always contact emergency services (112) for medical emergencies.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Life Line Kashmir. Built with ❤️ for our community.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: React.ElementType }) {
  return (
    <a
      href={href}
      className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}
