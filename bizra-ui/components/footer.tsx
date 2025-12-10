import { Button } from "@/components/ui/button"
import { Github, Twitter, Linkedin, Instagram } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    Services: [
      "Brand Design",
      "Web Development",
      "Mobile Apps",
      "Digital Strategy",
      "Performance Optimization",
      "Consulting",
    ],
    Company: ["About Us", "Our Process", "Careers", "Blog", "Case Studies", "Contact"],
    Resources: ["Documentation", "Support Center", "Privacy Policy", "Terms of Service", "Cookie Policy", "Sitemap"],
  }

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold font-serif mb-4">Apex Studio</h3>
              <p className="text-primary-foreground/80 mb-6 leading-relaxed max-w-md">
                Crafting exceptional digital experiences that inspire, engage, and drive results for forward-thinking
                brands.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <Button
                      key={social.label}
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 p-0 hover:bg-primary-foreground/10"
                      asChild
                    >
                      <a href={social.href} aria-label={social.label}>
                        <Icon className="h-5 w-5" />
                      </a>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold mb-4 text-primary-foreground">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-primary-foreground/70 text-sm">© {currentYear} Apex Studio. All rights reserved.</div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
