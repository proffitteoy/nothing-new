import PageTransition from "../../components/PageTransition"
import FriendsBoard from "./FriendsBoard"
import { siteConfig } from "@/siteConfig"

export const metadata = {
  title: "友链 | " + siteConfig.title,
  description: "赛博空间里的有趣灵魂",
  alternates: { canonical: "/friends" },
}

export default function FriendsPage() {
  return (
    <div className="min-h-screen relative">
      <PageTransition>
        <FriendsBoard />
      </PageTransition>
    </div>
  )
}
