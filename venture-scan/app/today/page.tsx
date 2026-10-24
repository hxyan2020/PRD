import { DailyRecommendation } from "@/components/DailyRecommendation";

export const metadata = {
  title: "Today's matched idea · VentureScan",
  description:
    "Build a short profile, then get today's best-matched startup idea with clear matches, gaps, and actions to close them.",
};

export default function TodayPage() {
  return <DailyRecommendation />;
}
