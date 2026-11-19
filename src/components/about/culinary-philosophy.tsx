import {
  CalendarDays,
  ChefHat,
  HeartHandshake,
  Sprout,
} from "lucide-react";

const principles = [
  {
    icon: Sprout,
    title: "Fresh by nature",
    description:
      "We begin with ingredients at their best, chosen for their character and cared for from market to plate.",
  },
  {
    icon: CalendarDays,
    title: "Led by the season",
    description:
      "A changing larder keeps the menu curious, generous, and connected to the moment.",
  },
  {
    icon: ChefHat,
    title: "Craft in every detail",
    description:
      "Technique gives each ingredient room to shine; thoughtful restraint is part of the recipe.",
  },
  {
    icon: HeartHandshake,
    title: "Hospitality, always",
    description:
      "Good service is attentive without hurry, making every guest feel like they belong at the table.",
  },
];

export function CulinaryPhilosophy() {
  return (
    <section
      aria-labelledby="about-philosophy-title"
      className="about-philosophy"
      id="philosophy"
    >
      <div className="about-section-intro">
        <span className="eyebrow">The way we see it</span>
        <h2 id="about-philosophy-title">
          The details are
          <br />
          <em>the difference.</em>
        </h2>
        <p>
          From the first ingredient to the last goodnight, care is the thread
          that ties the experience together.
        </p>
      </div>

      <ul className="about-principles">
        {principles.map(({ icon: Icon, title, description }, index) => (
          <li className="about-principle" key={title}>
            <span className="about-principle-number">0{index + 1}</span>
            <Icon aria-hidden="true" className="about-principle-icon" size={22} />
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
