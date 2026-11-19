import { ArrowUpRight, Camera, Music2, UsersRound } from "lucide-react";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: Camera,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: UsersRound,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/",
    icon: Music2,
  },
];

export function ContactSocialLinks() {
  return (
    <section aria-labelledby="contact-social-title" className="contact-social">
      <div>
        <span className="eyebrow eyebrow-dark">Elsewhere, occasionally</span>
        <h2 id="contact-social-title">
          Follow the
          <br />
          <em>conversation.</em>
        </h2>
      </div>
      <div className="contact-social-links">
        {socialLinks.map(({ label, href, icon: Icon }) => (
          <a
            href={href}
            key={label}
            rel="noreferrer"
            target="_blank"
            aria-label={`${label} demo link; opens the ${label} website, not a LuxeBite profile`}
          >
            <Icon aria-hidden="true" size={17} />
            <span>{label}</span>
            <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        ))}
        <p>
          Demo links only. They open the social platforms, not LuxeBite
          accounts.
        </p>
      </div>
    </section>
  );
}
