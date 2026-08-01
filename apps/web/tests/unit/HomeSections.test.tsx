import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "../../src/api/baseApi";
import authReducer from "../../src/features/auth/authSlice";
import { HeroSection } from "../../src/customer/components/home/HeroSection";
import { HowItWorksSection } from "../../src/customer/components/home/HowItWorksSection";
import { WhyChooseUsSection } from "../../src/customer/components/home/WhyChooseUsSection";
import { TrustSection } from "../../src/customer/components/home/TrustSection";
import { ContactCtaSection } from "../../src/customer/components/home/ContactCtaSection";
import type { ContentBlock } from "../../src/api/contentApi";
import "../../src/lib/i18n";

function renderWithProviders(ui: React.ReactElement) {
  const store = configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
}

const CONTENT_BLOCK: ContentBlock = {
  id: "1",
  key: "home-hero",
  type: "SECTION",
  titleAr: "عنوان مخصص",
  titleEn: "Custom Title",
  bodyAr: "نص مخصص",
  bodyEn: "Custom Body",
  sortOrder: 1,
  active: true,
};

describe("HeroSection", () => {
  it("renders fallback Arabic copy and both CTAs when no content block is configured", () => {
    renderWithProviders(<HeroSection />);
    expect(screen.getByText("خدمات تنظيف احترافية في عسير")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "احجز الآن" })).toHaveAttribute("href", "/services");
    expect(screen.getByRole("link", { name: "استعرض الخدمات" })).toHaveAttribute("href", "/services");
  });

  it("renders the Admin-configured content block when present", () => {
    renderWithProviders(<HeroSection block={CONTENT_BLOCK} />);
    expect(screen.getByText("عنوان مخصص")).toBeInTheDocument();
    expect(screen.getByText("نص مخصص")).toBeInTheDocument();
    expect(screen.queryByText("خدمات تنظيف احترافية في عسير")).not.toBeInTheDocument();
  });
});

describe("HowItWorksSection", () => {
  it("renders all four static steps", () => {
    renderWithProviders(<HowItWorksSection />);
    expect(screen.getByText("اختر الخدمة")).toBeInTheDocument();
    expect(screen.getByText("احجز موعدك")).toBeInTheDocument();
    expect(screen.getByText("احصل على السعر")).toBeInTheDocument();
    expect(screen.getByText("استمتع بالخدمة")).toBeInTheDocument();
  });
});

describe("WhyChooseUsSection", () => {
  it("falls back to three structured feature items when no content block is configured", () => {
    renderWithProviders(<WhyChooseUsSection />);
    expect(screen.getByText("فريق مدرب ومحترف")).toBeInTheDocument();
    expect(screen.getByText("ضمان الجودة")).toBeInTheDocument();
    expect(screen.getByText("حجز سهل ومرن")).toBeInTheDocument();
  });

  it("uses the configured intro while retaining the structured benefit list", () => {
    renderWithProviders(<WhyChooseUsSection block={{ ...CONTENT_BLOCK, key: "home-why-us" }} />);
    expect(screen.getByText("نص مخصص")).toBeInTheDocument();
    expect(screen.getByText("فريق مدرب ومحترف")).toBeInTheDocument();
  });
});

describe("TrustSection", () => {
  it("shows fallback qualitative text with no stat tiles before the stats query resolves", () => {
    renderWithProviders(<TrustSection />);
    expect(screen.getByText("نلتزم بأعلى معايير الجودة والاحترافية في كل خدمة نقدمها.")).toBeInTheDocument();
    expect(screen.queryByText(/حجز مكتمل/)).not.toBeInTheDocument();
    expect(screen.queryByText(/تقييم/)).not.toBeInTheDocument();
  });
});

describe("ContactCtaSection", () => {
  it("links the WhatsApp booking button to the configured business number", () => {
    renderWithProviders(<ContactCtaSection />);
    const whatsappLink = screen.getByRole("link", { name: /واتساب/ });

    expect(whatsappLink).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/+966502266402?text="),
    );
    expect(whatsappLink).toHaveAttribute("target", "_blank");
  });
});
