# Site palettes

Eight route-specific content palettes and four independent core palettes are defined in `app/site-palettes.css`. Page tokens govern paper, ink, headings and local structure. Core tokens govern controls, links and selection.

| Route | Page theme |
| --- | --- |
| / | Coast and wood |
| /projects | Pool and mint |
| /anime | Winter violet |
| /chatter | Almond rose |
| /blog | Forest and warm paper |
| /papers | Blue ink and violet grey |
| /friends | Ochre and pale gold |
| /about | Sage and faded rose |

The initial inline bootstrap selects once per tab session via sessionStorage. An explicit preference in About persists via localStorage. Auto can redraw without changing routes. Unavailable or invalid storage falls back to blue. Tabs opened from another tab may inherit its sessionStorage snapshot. Page roots provide local tokens for server-rendered content.

Keep artwork, room materials, masks, syntax highlighting and graph category colors independent of UI color. Use semantic status tokens for feedback. Test eight routes across four core modes, reloads, deep links, focus, mobile navigation, opening, graph, image text and fixed status. Full build and real-browser checks remain required before merging.
