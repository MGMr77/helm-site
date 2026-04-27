// Helm site config.
// Replace the two placeholders below with real Supabase credentials before
// the first deploy. Anon key is safe to expose in the browser; the
// service_role key must NEVER be placed here.
//
// Where to find them:
//   Supabase dashboard → Project settings → API
//
// Decide which project to point at:
//   (a) Reuse the existing RevKitchen Platform Supabase project — simplest,
//       signups land in the same activity_log as everything else.
//   (b) Create a dedicated MGM Hospitality Supabase project — cleanest
//       if MGM is legally/operationally separate from RevKitchen.
//
// Whichever you pick, apply migration 0005_helm_waitlist.sql there first.
window.HELM_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "REPLACE_WITH_ANON_KEY",
};
