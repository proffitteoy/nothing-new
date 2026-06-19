import type { Metadata } from "next"
import { Award, GraduationCap, Mail, MapPin, Phone, UserRound } from "lucide-react"
import { aboutProfile, profile } from "@/lib/profile"

export const metadata: Metadata = {
  title: "关于",
  description: "李炫良的个人简介。",
}

export default function AboutPage() {
  return (
    <div className="butterfly-page">
      <section className="about-hero glass-panel">
        <img src={profile.avatar} alt={`${profile.name} 的头像`} />
        <div>
          <p className="section-eyebrow">About</p>
          <h1>{profile.name}</h1>
          <p>{aboutProfile.description}</p>
          <div className="about-contact">
            <span>
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
            <a href={`mailto:${profile.email}`}>
              <Mail className="h-4 w-4" />
              {profile.email}
            </a>
            <span>
              <Phone className="h-4 w-4" />
              {profile.phone}
            </span>
          </div>
        </div>
      </section>

      <section className="about-grid">
        <article className="glass-panel about-card">
          <h2 className="home-card__headline">
            <UserRound className="h-5 w-5" />
            <span>目标方向</span>
          </h2>
          <p>{aboutProfile.target}</p>
        </article>

        <article className="glass-panel about-card">
          <h2 className="home-card__headline">
            <GraduationCap className="h-5 w-5" />
            <span>教育背景</span>
          </h2>
          <h3>{aboutProfile.education.institution}</h3>
          <p>
            {aboutProfile.education.degree} / {aboutProfile.education.period}
          </p>
          <ul>
            {aboutProfile.education.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="glass-panel about-card">
        <h2 className="home-card__headline">技能与方向</h2>
        <div className="skill-grid">
          {aboutProfile.skillGroups.map(([group, items]) => (
            <div key={group}>
              <h3>{group}</h3>
              <div className="skill-tags">
                {items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel about-card">
        <h2 className="home-card__headline">
          <Award className="h-5 w-5" />
          <span>竞赛与奖项</span>
        </h2>
        <ul className="award-list">
          {aboutProfile.awards.map((award) => (
            <li key={award}>{award}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
