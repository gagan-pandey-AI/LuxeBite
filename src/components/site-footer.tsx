import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="visit">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="brand-name footer-logo" href="/">
            LUXEBITE<span className="gold-dot">.</span>
          </Link>
          <p>Good food. Beautifully lived.</p>
        </div>

        <div className="footer-column">
          <span className="footer-label">Find us</span>
          <a
            href="https://maps.google.com/?q=18+W+27th+St+New+York+NY"
            rel="noreferrer"
            target="_blank"
          >
            18 West 27th Street
            <br />
            New York, NY 10001 <ArrowUpRight aria-hidden="true" size={13} />
          </a>
        </div>

        <div className="footer-column">
          <span className="footer-label">Come by</span>
          <p>
            Tuesday – Sunday
            <br />
            5:00 pm – 10:30 pm
          </p>
        </div>

        <div className="footer-column">
          <span className="footer-label">Say hello</span>
          <a href="tel:+12125550148">(212) 555-0148</a>
          <a href="mailto:hello@luxebite.com">hello@luxebite.com</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} LuxeBite. All rights reserved.</span>
        <span>Concept demo · menu, people &amp; contact details are samples.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
