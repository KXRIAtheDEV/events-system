"""
events/discovery.py
===================
Location-based event discovery engine for EventHub.

Responsibilities:
  - Resolve a Kenyan county from browser GPS coords (Nominatim/OSM) or IP address (ip-api.com)
  - Scrape Ticketsasa, AllEvents.in, and Eventbrite for events in that county
  - Run all scrapers in parallel via ThreadPoolExecutor
  - Deduplicate and return a clean list of external-event dicts

All sources are free public websites — zero paid API keys required.
"""

import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import unquote

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REQUEST_TIMEOUT = 8  # seconds per scraper HTTP call
SCRAPER_TIMEOUT = 10  # seconds for the whole ThreadPoolExecutor round-trip

SCRAPER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
}

# Keyword → canonical county name used for DB filtering and display
KENYA_COUNTIES = {
    "nairobi": "Nairobi",
    "mombasa": "Mombasa",
    "kisumu": "Kisumu",
    "nakuru": "Nakuru",
    "eldoret": "Eldoret",
    "uasin gishu": "Uasin Gishu",
    "thika": "Kiambu",
    "kiambu": "Kiambu",
    "machakos": "Machakos",
    "meru": "Meru",
    "kisii": "Kisii",
    "nyeri": "Nyeri",
    "kakamega": "Kakamega",
    "malindi": "Kilifi",
    "kilifi": "Kilifi",
    "garissa": "Garissa",
    "lamu": "Lamu",
    "naivasha": "Nakuru",
    "nanyuki": "Laikipia",
    "laikipia": "Laikipia",
    "embu": "Embu",
    "kitui": "Kitui",
    "bungoma": "Bungoma",
    "kericho": "Kericho",
    "migori": "Migori",
    "siaya": "Siaya",
    "homabay": "Homa Bay",
    "homa bay": "Homa Bay",
}


# ---------------------------------------------------------------------------
# Location Resolution
# ---------------------------------------------------------------------------


def resolve_county_from_coords(lat: float, lng: float) -> str | None:
    """
    Reverse-geocode GPS coordinates to a Kenyan county name via
    OpenStreetMap Nominatim (free, no key required).

    Returns the county name string, or None if the call fails.
    """
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": lat,
            "lon": lng,
            "format": "json",
            "zoom": 10,
            "addressdetails": 1,
        }
        headers = {"User-Agent": "EventHub-Kenya/1.0 (contact@eventhub.ke)"}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address", {})
        raw = (
            addr.get("county")
            or addr.get("state_district")
            or addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or ""
        )
        # Strip trailing "County" word if present
        county = re.sub(r"\s*county\s*$", "", raw, flags=re.IGNORECASE).strip()
        return county or None
    except Exception as exc:
        logger.warning("Nominatim reverse-geocode failed: %s", exc)
        return None


def resolve_county_from_ip(ip_address: str) -> str:
    """
    Determine city/county from an IP address via ip-api.com (free, 45 req/min).
    Returns a county name; falls back to 'Nairobi' on any error.
    """
    if ip_address in ("127.0.0.1", "::1", "localhost", ""):
        return "Nairobi"
    try:
        resp = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=4)
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") == "success":
            city = (data.get("city") or "").lower()
            region = (data.get("regionName") or "").lower()
            combined = f"{city} {region}"
            for key, val in KENYA_COUNTIES.items():
                if key in combined:
                    return val
            # Return raw city name if we don't have a mapping
            return (data.get("city") or "Nairobi").title()
    except Exception as exc:
        logger.warning("IP geolocation failed: %s", exc)
    return "Nairobi"


def normalize_county(location_text: str) -> str:
    """
    Convert a free-text location string (e.g. from user profile) to a
    clean canonical county name.
    """
    if not location_text:
        return "Nairobi"
    text = location_text.lower().strip()
    for key, val in KENYA_COUNTIES.items():
        if key in text:
            return val
    # Capitalise as-is if no mapping found
    return location_text.strip().title()


# ---------------------------------------------------------------------------
# Scrapers
# ---------------------------------------------------------------------------


def _safe_text(el) -> str:
    """Extract stripped text from a BS4 element, returning '' if None."""
    return el.get_text(strip=True) if el else ""


def _resolve_url(href: str, base: str) -> str:
    """Make a relative URL absolute."""
    if not href:
        return base
    if href.startswith("http"):
        return href
    return base.rstrip("/") + "/" + href.lstrip("/")


def _get_image(el) -> str:
    """Extract an image URL from a BS4 <img> element."""
    if not el:
        return ""
    src = el.get("data-src") or el.get("data-lazy") or el.get("src") or ""
    if src.startswith("data:"):
        return ""
    return src


# ---- Ticketsasa ----

def scrape_ticketsasa(county: str) -> list[dict]:
    """Scrape ticketsasa.com for events in *county*."""
    results = []
    base = "https://www.ticketsasa.com"
    try:
        url = f"{base}/events?q={county}"
        resp = requests.get(url, headers=SCRAPER_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Ticketsasa uses various card structures depending on the version
        cards = (
            soup.select(".event-card")
            or soup.select(".event-item")
            or soup.select("article[class*='event']")
            or soup.select(".col-md-4 .card, .col-sm-6 .card")
        )

        for card in cards[:12]:
            title_el = card.select_one("h2, h3, h4, .event-title, [class*='title']")
            title = _safe_text(title_el)
            if not title or len(title) < 3:
                continue

            date_el = card.select_one(".date, .event-date, time, [class*='date']")
            venue_el = card.select_one(".venue, .location, [class*='venue'], [class*='location']")
            price_el = card.select_one(".price, [class*='price'], .ticket-price")
            link_el = card.select_one("a[href]")
            img_el = card.select_one("img")

            link = _resolve_url(link_el.get("href", "") if link_el else "", base)
            image = _get_image(img_el)
            if image and not image.startswith("http"):
                image = _resolve_url(image, base)

            results.append({
                "type": "external",
                "title": title[:120],
                "date_text": _safe_text(date_el) or "Check website",
                "venue": _safe_text(venue_el) or county,
                "price_text": _safe_text(price_el) or "Check website",
                "source": "Ticketsasa",
                "source_url": link,
                "image_url": image,
                "description": f"{title} — {county}",
                "can_purchase": False,
            })
    except Exception as exc:
        logger.warning("Ticketsasa scrape failed for %s: %s", county, exc)
    return results


# ---- AllEvents.in ----

def scrape_allevents(county: str) -> list[dict]:
    """Scrape allevents.in for events in *county*."""
    results = []
    base = "https://allevents.in"
    city_slug = county.lower().replace(" ", "-")
    try:
        url = f"{base}/{city_slug}/all"
        resp = requests.get(url, headers=SCRAPER_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        cards = (
            soup.select(".event-item")
            or soup.select(".eventlist-box")
            or soup.select("[class*='event-card']")
            or soup.select("li.item")
            or soup.select(".card[class*='event']")
        )

        for card in cards[:12]:
            title_el = card.select_one(
                "h3, h4, .event-name, [class*='title'], [itemprop='name']"
            )
            title = _safe_text(title_el)
            if not title or len(title) < 3:
                continue

            date_el = card.select_one("[class*='date'], time, [itemprop='startDate']")
            venue_el = card.select_one(
                "[class*='venue'], [class*='location'], [itemprop='location']"
            )
            link_el = card.select_one("a[href]")
            img_el = card.select_one("img")

            date_text = _safe_text(date_el) or "Check website"
            if date_el and date_el.get("datetime"):
                date_text = date_el["datetime"]

            link = _resolve_url(link_el.get("href", "") if link_el else "", base)
            image = _get_image(img_el)

            results.append({
                "type": "external",
                "title": title[:120],
                "date_text": date_text,
                "venue": _safe_text(venue_el) or county,
                "price_text": "Check website",
                "source": "AllEvents.in",
                "source_url": link or f"{base}/{city_slug}/all",
                "image_url": image,
                "description": f"{title} in {county}",
                "can_purchase": False,
            })
    except Exception as exc:
        logger.warning("AllEvents scrape failed for %s: %s", county, exc)
    return results


# ---- Eventbrite ----

def scrape_eventbrite(county: str) -> list[dict]:
    """Scrape Eventbrite Kenya events for *county*."""
    results = []
    base = "https://www.eventbrite.com"
    city_slug = county.lower().replace(" ", "-")
    try:
        url = f"{base}/d/kenya--{city_slug}/events/"
        resp = requests.get(url, headers=SCRAPER_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Eventbrite renders multiple card shapes depending on A/B tests
        cards = (
            soup.select("[data-testid='event-card']")
            or soup.select(".eds-event-card")
            or soup.select(".search-event-card")
            or soup.select("article[class*='card']")
        )

        for card in cards[:12]:
            title_el = card.select_one(
                "[data-testid='event-title'], h3, h2, "
                ".eds-event-card__formatted-name, [class*='title']"
            )
            title = _safe_text(title_el)
            if not title or len(title) < 3:
                continue

            date_el = card.select_one(
                "[data-testid='event-card-date'], .eds-event-card__sub-title, "
                "p[class*='date'], time"
            )
            venue_el = card.select_one(
                "[data-testid='event-card-venue'], .card-text--truncated, "
                "[class*='location']"
            )
            link_el = card.select_one("a[href]")
            img_el = card.select_one("img")

            link = _resolve_url(link_el.get("href", "") if link_el else "", base)
            image = _get_image(img_el)

            results.append({
                "type": "external",
                "title": title[:120],
                "date_text": _safe_text(date_el) or "Check website",
                "venue": _safe_text(venue_el) or county,
                "price_text": "Check website",
                "source": "Eventbrite",
                "source_url": link or f"{base}/d/kenya--{city_slug}/events/",
                "image_url": image,
                "description": f"{title} in {county}",
                "can_purchase": False,
            })
    except Exception as exc:
        logger.warning("Eventbrite scrape failed for %s: %s", county, exc)
    return results


# ---- DuckDuckGo broad search (fallback) ----

def scrape_duckduckgo_events(county: str) -> list[dict]:
    """
    Broad fallback: POST to DuckDuckGo HTML endpoint and extract result links
    that reference known event platforms or contain 'event' keywords.
    Only runs when the above scrapers return very few results.
    """
    results = []
    try:
        from datetime import datetime
        year = datetime.now().year
        query = f'upcoming events in {county} Kenya {year} site:ticketsasa.com OR site:eventbrite.com OR site:allevents.in'
        resp = requests.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query},
            headers=SCRAPER_HEADERS,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        for el in soup.select(".result__body, .result")[:8]:
            title_el = el.select_one(".result__a")
            snippet_el = el.select_one(".result__snippet")

            title = _safe_text(title_el)
            if not title or len(title) < 4:
                continue

            raw_href = title_el.get("href", "") if title_el else ""
            # DuckDuckGo wraps links — extract the real URL
            match = re.search(r"uddg=([^&]+)", raw_href)
            link = unquote(match.group(1)) if match else raw_href

            snippet = _safe_text(snippet_el)

            # Map known platforms
            source = "Web"
            if "ticketsasa" in link:
                source = "Ticketsasa"
            elif "eventbrite" in link:
                source = "Eventbrite"
            elif "allevents" in link:
                source = "AllEvents.in"
            elif "facebook" in link:
                source = "Facebook Events"

            results.append({
                "type": "external",
                "title": title[:120],
                "date_text": "Check website for dates",
                "venue": county,
                "price_text": "Check website",
                "source": source,
                "source_url": link,
                "image_url": "",
                "description": snippet[:200],
                "can_purchase": False,
            })
    except Exception as exc:
        logger.warning("DuckDuckGo search failed for %s: %s", county, exc)
    return results


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


def discover_events_for_county(county: str) -> list[dict]:
    """
    Run all three scrapers in parallel (ThreadPoolExecutor, max 3 workers).
    Falls back to DuckDuckGo broad search if the primary scrapers return < 3 results.
    Returns a deduplicated list of external-event dicts.

    Args:
        county: A canonical Kenyan county name, e.g. "Nairobi" or "Mombasa".

    Returns:
        List of dicts; each has keys: type, title, date_text, venue, price_text,
        source, source_url, image_url, description, can_purchase.
    """
    all_results: list[dict] = []

    primary_scrapers = [
        ("ticketsasa", scrape_ticketsasa),
        ("allevents", scrape_allevents),
        ("eventbrite", scrape_eventbrite),
    ]

    with ThreadPoolExecutor(max_workers=3) as executor:
        future_map = {
            executor.submit(fn, county): name
            for name, fn in primary_scrapers
        }
        for future in as_completed(future_map, timeout=SCRAPER_TIMEOUT):
            name = future_map[future]
            try:
                batch = future.result(timeout=2)
                all_results.extend(batch)
                logger.info("Scraper '%s' returned %d events for %s", name, len(batch), county)
            except Exception as exc:
                logger.warning("Scraper '%s' raised: %s", name, exc)

    # Use DuckDuckGo as a wide-net fallback when primary scrapers find little
    if len(all_results) < 3:
        logger.info("Primary scrapers returned < 3 results; falling back to DuckDuckGo")
        all_results.extend(scrape_duckduckgo_events(county))

    # Deduplicate by normalised title
    seen: set[str] = set()
    unique: list[dict] = []
    for event in all_results:
        key = re.sub(r"\s+", " ", event["title"].lower().strip())
        if key and key not in seen:
            seen.add(key)
            unique.append(event)

    return unique
