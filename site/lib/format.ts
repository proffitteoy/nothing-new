export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value)
}

export function titleFromTag(tag: string) {
  return tag
    .split("/")
    .filter(Boolean)
    .join(" / ")
}
