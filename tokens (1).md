---
name: Design tokens and icon system
description: Premium color palette, typography, shadows, colorful icon accent palette, and motion tokens
type: design
---

## Typography
- Primary: Helvetica Neue (heading, sans, support)
- Secondary: JetBrains Mono (mono, card-value, counters only)

## Color palette  
- Primary: 200 35% 22% (deep navy-teal #243d4d)
- Background: 210 14% 95%
- Card: 0 0% 100%
- Sidebar: matches primary

## Icon accent palette (HSL)
Each icon-box gets a semantic color:
- teal: 180 45% 40%  — Dashboard, Área Metodista, mobile  
- blue: 210 70% 52%  — Agenda, compromissos  
- indigo: 230 55% 55%  — Editor, Assistente  
- violet: 260 50% 55%  — Pregações, Diário, semanal  
- rose: 345 60% 55%  — Bíblia, prioridades  
- amber: 38 90% 50%  — Relatórios, Assinatura, rotina manhã  
- emerald: 155 60% 40%  — Tarefas, Financeiro  
- orange: 25 90% 55%  — Biblioteca, rotina tarde  
- cyan: 190 70% 42%  — Planner, próximos  
- slate: 200 20% 50%  — generic/fallback

## Usage
- CSS classes: `.icon-box .icon-box-{color}` — applies bg + svg color
- Hover: scale(1.08) with spring cubic-bezier(0.34, 1.56, 0.64, 1)
- Benefit cards: scale(1.1) rotate(-3deg) on hover
- Module cards: scale(1.1) on hover
- Card metrics: same spring scale on hover

## Shadows
--shadow-xs through --shadow-xl, --shadow-glow

## Motion
- Spring easing: cubic-bezier(0.34, 1.56, 0.64, 1) for icon interactions
- Standard: cubic-bezier(0.4, 0, 0.2, 1) for layout transitions
- Duration: 200-350ms for micro-interactions
