import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

if (
  !window.location.host.includes("127.0.0.1") &&
  !window.location.host.includes("localhost")
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/relay-tsez/",
    ui_host: "https://us.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: false, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
    debug: process.env.NODE_ENV === "development",
  });

  Sentry.init({
    dsn: "https://7092c614eef24263d7fb75c654ae44fd@o4509588397752320.ingest.us.sentry.io/4509629239394304",

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Disable session replay
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
