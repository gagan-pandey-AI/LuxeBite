import { Plus } from "lucide-react";

const questions = [
  {
    question: "Will my message receive an automatic reply?",
    answer:
      "No. The contact form stores a message after successful submission, but automated email replies are not configured for this concept demo.",
  },
  {
    question: "Are the address and contact details real?",
    answer:
      "No. The address, phone, email, hours, map, and social links are fictional demonstration details. There is no real LuxeBite restaurant location.",
  },
  {
    question: "Does a message request a reservation?",
    answer:
      "No. Use the reservation form to request a table. Reservation requests remain pending until the restaurant confirms them directly.",
  },
  {
    question: "Can I mention dietary or accessibility needs?",
    answer:
      "Yes. Include them in your message. Any accommodation would need to be reviewed and confirmed by the restaurant; this demo does not represent a real venue policy.",
  },
];

export function ContactFaq() {
  return (
    <section aria-labelledby="contact-faq-title" className="contact-faq">
      <div className="contact-faq-heading">
        <span className="eyebrow">A few things you may wonder</span>
        <h2 id="contact-faq-title">
          Before you
          <br />
          <em>write to us.</em>
        </h2>
        <p>Concept answers for a fictional restaurant experience.</p>
      </div>

      <div className="contact-faq-list">
        {questions.map(({ question, answer }) => (
          <details className="contact-faq-item" key={question}>
            <summary>
              <span>{question}</span>
              <Plus aria-hidden="true" size={17} />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
