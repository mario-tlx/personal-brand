import { site } from "@/content/site";
import { Journey } from "@/components/journey/Journey";
import { currentYear } from "@/lib/journey";

export default function HomePage() {
  // Evaluated when the static page is built: "today" on the time axis.
  return <Journey content={site.en} today={currentYear()} />;
}
