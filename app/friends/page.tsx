import PageTransition from "../../components/PageTransition"
import FriendsBoard from "./FriendsBoard"
import { siteConfig } from "@/siteConfig"

export const metadata = {
  title: "友链 | " + siteConfig.title,
  description: "朋友们的独立站点与博客，以及交换友链的方式。",
}

export default function FriendsPage() {
  return (
    <div className="relative min-h-screen">
      <PageTransition>
        <FriendsBoard />
      </PageTransition>
    </div>
  )
}
