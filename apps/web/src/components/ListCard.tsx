import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Tone } from "../lib/tone";

interface ListCardProps {
  tone: Tone;
  icon: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  pill: ReactNode;
  value?: ReactNode;
  /** Present only for rows that navigate somewhere (e.g. bookings); omit for view-only rows. */
  href?: string;
}

// Shared row shape for the account-area list pages (bookings, subscriptions,
// notifications): icon, title/subtitle, and a trailing value/status pill.
// Only `href` rows get the accent border and hover/focus affordance — a
// view-only row shouldn't look clickable.
export function ListCard({ tone, icon, title, subtitle, pill, value, href }: ListCardProps) {
  const className = `list-card tone-${tone}${href ? " list-card--linked" : ""}`;

  const content = (
    <>
      <span className={`list-card-icon tone-${tone}`} aria-hidden="true">
        {icon}
      </span>
      <span className="list-card-meta">
        <strong className="list-card-title">{title}</strong>
        <span className="list-card-subtitle">{subtitle}</span>
      </span>
      <span className="list-card-summary">
        {value != null && <strong className="list-card-value">{value}</strong>}
        <span className={`status-pill tone-${tone}`}>{pill}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
