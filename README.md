
# EventHub - Frontend Only

A modern, responsive event management system frontend with glassmorphic UI design. This is the complete frontend template with 44 HTML pages and 18 CSS modules ready to use with any backend.

## Description

EventHub Frontend provides a complete user interface for event management including user dashboards, event listings, booking flows, authentication pages, and admin panels. Built with modern CSS and responsive design patterns.

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom styles + Glassmorphic effects
- **JavaScript (Vanilla)** - Interactive components
- **Django Templates** - Template inheritance system

## What to Install

For frontend only (static HTML/CSS):

# No installation needed! Just clone and open
git clone https://github.com/Wilsonthoma/Event-Hub.git
cd Event-Hub

# View any HTML file directly in browser
open events/templates/index.html

For full backend integration (optional):

# Python 3.10+ required
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django

## Environment Setup

### For Frontend Only:

# Just serve with any static server
# Using Python:
python -m http.server 8000

# Using VS Code:
# Install "Live Server" extension → Right click HTML → Open with Live Server

### For Django Integration:

# 1. Create .env file
cat > .env << 'ENV'
SECRET_KEY=django-insecure-key-change-this
DEBUG=True
ENV

# 2. Configure settings (if using Django backend)
# Update event_management/settings.py with your database


## Quick Start

# Clone repository
git clone https://github.com/Wilsonthoma/Event-Hub.git
cd Event-Hub

# View project structure
ls -la events/templates/

# Open homepage
# Double-click events/templates/index.html
# OR run local server:
python -m http.server --directory events/templates/
# Then visit http://localhost:8000


## Pages Included (44 Templates)


templates/
├── index.html              # Homepage
├── base.html               # Base layout
├── contact.html            # Contact page
├── login.html              # Login page
├── register.html           # Register page
├── dashboard.html          # User dashboard
├── event_list.html         # Browse events
├── event_detail.html       # Event details
├── checkout.html           # Ticket checkout
└── ... (35 more pages)


## CSS Modules (18 Files)

- `main.css` - Core styles
- `glassmorphic.css` - Glass effects
- `responsive.css` - Mobile layouts
- `animations.css` - Transitions
- `forms.css` - Form styling
- `buttons.css` - Button components
- `cards.css` - Card layouts
- `navbar.css` - Navigation
- `footer.css` - Footer styles
- `hero.css` - Hero section
- `auth.css` - Authentication pages
- `utilities.css` - Helper classes
- And 6 more...

## Customization


}


## Project Structure

Event-Hub/
├── events/
│   ├── templates/        # 44 HTML files
│   └── static/css/       # 18 CSS files
├── static/images/        # Images assets
└── README.md

## Dependencies

**Frontend only:** None (pure HTML/CSS/JS)

**Optional Django backend:**

Django==5.1.4
Pillow==10.1.0
django-qrcode==2.1.0

## Live Demo

https://github.com/Wilsonthoma/Event-Hub
