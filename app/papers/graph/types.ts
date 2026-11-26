// Adapted from MmzMing/my-blog@524fd989bd332c7480033aef6983f8423ced63cc.
// MIT; copyright and source details: docs/licenses/MmzMing-Graph-MIT.txt.
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3"
export type GraphTier = "category" | "tag" | "post" | "heading"

export type KGLinkKind = "category-tag" | "tag-post" | "post-heading" | "category-post" | "tag-tag"

export type KGNode = {
  id: string
  tier: GraphTier
  name: string
  searchText?: string
  url: string
  /** 0-7 → --tag-graph-node-{n+1}；-1 = 未分类，渲染时走 muted */
  colorIndex: number
  /** 归属分类节点 id，筛选与配色都以它为准 */
  categoryId: string
  /** 半径映射权重：分类/标签 = 文章数，文章 = H2 数，标题 = 1 */
  value: number
  /** 回放用毫秒时间戳；分类/标签取其下最早文章 */
  publishedAt: number
  /** heading 专用，当前恒为 2；保留字段以便将来放开 H3 */
  depth?: number
  /** heading/post 专用，指向所属文章的 collection id */
  postId?: string
}

export type KGLink = {
  source: string
  target: string
  kind: KGLinkKind
  /** 共现/归属次数；层级边恒为 1 */
  value: number
}

export type KGCategoryMeta = {
  id: string
  name: string
  url: string
  colorIndex: number
  postCount: number
  tagCount: number
}

/**
 * 极小的元信息对象，会被内联进 HTML（约 400 字节），
 * 让筛选面板的分类图例与时间轴范围在首帧就能服务端渲染，
 * 不必等 /api/knowledge-graph.json 返回。
 */
export type KGMeta = {
  version: 1
  categories: KGCategoryMeta[]
  counts: Record<GraphTier, number>
  timeRange: { from: number; to: number }
  /** 构建期采纳的标题深度上限，当前为 2 */
  headingDepth: number
}

export type KGData = {
  nodes: KGNode[]
  links: KGLink[]
  meta: KGMeta
}

export interface SceneNode extends SimulationNodeDatum {
  readonly data: KGNode
  readonly tier: GraphTier
  radius: number
  /** 全部邻接（无向） */
  neighbors: Set<string>
  /** 上层邻接，级联筛选用 */
  parents: Set<string>
  children: Set<string>
  degree: number
  /** 通过筛选（面板写） */
  filtered: boolean
  /** 命中搜索关键词 */
  matched: boolean
  /** 回放已揭示（playback 写） */
  revealed: boolean
  /** 0..1 揭示进度，纯游标时间函数，可双向擦洗 */
  reveal: number
  /** 播放槽位，只在当前可见节点之间连续编号；-1 = 被筛掉，不参与排队。
	    每轮 applyReveal 重排一次，所以改了筛选后剩下的仍是匀速逐个冒 */
  revealSlot: number
  /** 这个节点揭示完（reveal 到 1）的时刻，performance.now() 口径。
	    0 = 还没揭示完。连线据此决定自己何时起笔 —— 两端都到位再等一段 */
  revealedAt: number
  selected: boolean
  /** -1 = 不在聚焦子图内；0 = 选中节点；1.. = 跳数 */
  focusDistance: number
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
  index?: number
}

export interface SceneLink extends SimulationLinkDatum<SceneNode> {
  readonly kind: KGLinkKind
  readonly value: number
  index: number
  source: string | SceneNode
  target: string | SceneNode
  visible: boolean
  /** 这条边变成可见的时刻（performance.now() 口径），0 = 当前不可见。
	    只由两端节点的 revealedAt 推不出这一项：改筛选让一条早就两端齐备的边
	    重新可见时，两端的揭示时间戳还是几秒前，连线会跳过描绘直接画完 */
  shownAt: number
}

export type ThemeColors = {
  accent: string
  surface: string
  text: string
  muted: string
  nodes: string[]
}

export type FilterState = {
  tiers: Record<GraphTier, boolean>
  /** 选中的分类节点 id；空集视为全选 */
  categories: Set<string>
  query: string
  minPosts: number
  showCooccurrence: boolean
  particles: boolean
}

export type PlaybackState = {
  playing: boolean
  /** 归一化播放头 0..1 */
  position: number
}

/** 视图模式：力导向图 / 脑图（四列布局） */
export type GraphLayoutMode = "graph" | "mindmap"

export type GraphStrings = {
  loaded: string
  failed: string
  tier: Record<GraphTier, string>
  posts: string
  sections: string
  relations: string
}

/** 详情面板的一组关联节点：同层列表，顺序按 byTier 的既定排序 */
export type KGSelectionGroup = {
  tier: GraphTier
  items: KGNode[]
}

/** kg:select 事件载荷：选中节点 + 按层级分组的下钻信息 */
export type KGSelection = {
  node: KGNode
  groups: KGSelectionGroup[]
}

export interface GraphController {
  destroy(): void
  patchFilters(patch: Partial<FilterState>): void
  getFilters(): FilterState
  playback: {
    toggle(): void
    restart(): void
    getState(): PlaybackState
  }
  resetView(): void
  /** 选中节点（传 id）；传 null 取消选中 */
  select(id: string | null): void
  /** 力导向 ⇄ 脑图切换；脑图入场带「节点滑入 + 连线三波描绘」动效 */
  toggleLayout(): void
}
