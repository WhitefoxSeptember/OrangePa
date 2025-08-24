# OrangePi 
OrangePi uses your Figma files, demos, and specs so that you can generate working prototypes that match your company’s design system and product standards.
# Inspiration
Prototyping has become a core responsibility for product managers, but current workflows are often slow, inconsistent, and cumbersome. PMs frequently struggle to create demos that faithfully reflect a company’s design standards, and these demos are typically not client-facing, limiting their use to internal teams and requiring extra explanations to stakeholders.
# Architecture
Page Data from Figma -> Agentic analysis and persistence of page content and page relationship -> Front-end generator with V0. 
# Agentic Logic
- Identify the key parts of each page, and whether they are links.
- Identify how each pages are connected to others.
- Generate a workable demo based on transition logic. 
