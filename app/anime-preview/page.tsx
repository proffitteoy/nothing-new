import Navbar from "../../components/Navbar"
import AnimeShelf from "../anime/AnimeShelf"

const covers = [
  "/about-cover.png",
  "/avatar.jpg",
  "/siamese-cat.png",
  "/blog/static/background.png",
  "/about-cover.png",
  "/avatar.jpg",
  "/siamese-cat.png",
  "/blog/static/background.png",
  "/about-cover.png",
  "/avatar.jpg",
  "/siamese-cat.png",
  "/blog/static/background.png",
]

const anime = covers.map((cover, index) => ({
  id: index + 1,
  title: `番剧封面示例 ${index + 1}`,
  cover,
}))

export default function AnimePreviewPage() {
  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      <AnimeShelf username="preview" watching={anime} watched={anime.slice(0, 8)} />
    </div>
  )
}
