import { useTranslation } from "react-i18next";
import { useListPublicContentBlocksQuery } from "../../api/contentApi";
import { HeroSection } from "../components/home/HeroSection";
import { ServicesSection } from "../components/home/ServicesSection";
import { HowItWorksSection } from "../components/home/HowItWorksSection";
import { WhyChooseUsSection } from "../components/home/WhyChooseUsSection";
import { FaqPreviewSection } from "../components/home/FaqPreviewSection";
import { ContactCtaSection } from "../components/home/ContactCtaSection";

// Content-block keys with a dedicated, structured section component
// (plan.md D3). Any other active SECTION block still renders, generically,
// below — an Admin adding a new block key is never silently dropped.
const KNOWN_SECTION_KEYS = new Set(["home-hero", "home-why-us", "home-trust", "home-contact"]);

// Public, prerender-eligible route (research.md R9). Composed from
// reusable sections (plan.md D3) instead of a flat content-block loop —
// each section uses existing service/content/FAQ/stats APIs and hides
// gracefully when its data isn't available (FR-006/FR-007).
export default function Home() {
  const { i18n } = useTranslation();
  const { data } = useListPublicContentBlocksQuery();
  const isAr = i18n.language === "ar";

  const sections = (data ?? []).filter((block) => block.type === "SECTION");
  const whyUsBlock = sections.find((b) => b.key === "home-why-us");
  const trustBlock = sections.find((b) => b.key === "home-trust");
  const contactBlock = sections.find((b) => b.key === "home-contact");
  const unknownSections = sections
    .filter((b) => !KNOWN_SECTION_KEYS.has(b.key))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main className="home-page overflow-hidden text-ink">
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      <WhyChooseUsSection block={whyUsBlock} trustBlock={trustBlock} />
      <FaqPreviewSection />
      <ContactCtaSection block={contactBlock} />
      {unknownSections.map((block) => (
        <section key={block.id} className="home-section px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-2 text-2xl font-bold">
              {isAr ? block.titleAr : block.titleEn || block.titleAr}
            </h2>
            <p className="text-base">{isAr ? block.bodyAr : block.bodyEn || block.bodyAr}</p>
          </div>
        </section>
      ))}
    </main>
  );
}
