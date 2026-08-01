import { baseApi } from "./baseApi";

export type SocialMediaPlatform = "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "X" | "WHATSAPP";

export interface SocialMediaLink {
  id: string;
  platform: SocialMediaPlatform;
  url: string;
  active: boolean;
}

export interface SocialMediaLinkInput {
  platform: SocialMediaPlatform;
  url: string;
  active: boolean;
}

export const socialMediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public — already filters to active-only server-side
    // (apps/api/src/modules/social-media/service.ts's listActive*), so
    // deactivated/unconfigured platforms never reach the footer.
    listPublicSocialMediaLinks: builder.query<SocialMediaLink[], void>({
      query: () => "/social-media",
      providesTags: ["SocialMediaLink"],
    }),
    listAllSocialMediaLinks: builder.query<SocialMediaLink[], void>({
      query: () => "/admin/social-media",
      providesTags: ["SocialMediaLink"],
    }),
    upsertSocialMediaLink: builder.mutation<SocialMediaLink, SocialMediaLinkInput>({
      query: (body) => ({ url: "/admin/social-media", method: "PUT", body }),
      invalidatesTags: ["SocialMediaLink"],
    }),
  }),
});

export const {
  useListPublicSocialMediaLinksQuery,
  useListAllSocialMediaLinksQuery,
  useUpsertSocialMediaLinkMutation,
} = socialMediaApi;
