import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/portfolioLink.scss"
import { classNames } from "../util/lang"

interface PortfolioLinkOptions {
  title: string
  label: string
  href: string
}

const defaultOptions: PortfolioLinkOptions = {
  title: "快捷入口",
  label: "个人主页",
  href: "/portfolio/",
}

export default ((opts?: Partial<PortfolioLinkOptions>) => {
  const options: PortfolioLinkOptions = { ...defaultOptions, ...opts }

  const PortfolioLink: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "portfolio-link")}>
        <h3>{options.title}</h3>
        <ul>
          <li>
            <a href={options.href} class="internal">
              {options.label}
            </a>
          </li>
        </ul>
      </div>
    )
  }

  PortfolioLink.css = style
  return PortfolioLink
}) satisfies QuartzComponentConstructor<Partial<PortfolioLinkOptions>>

