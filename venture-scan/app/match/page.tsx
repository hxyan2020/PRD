import { ProfileChatbot } from "@/components/ProfileChatbot";

export const metadata = {
  title: "Match profile · VentureScan",
  description:
    "Chatbot that collects skills, major, current business, and interested domains, then scores each sourced startup idea.",
};

export default function MatchPage() {
  return <ProfileChatbot />;
}
