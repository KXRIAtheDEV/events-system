with open(r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\frontend\templates\attendee\components\navbar.html", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in ["events", "ticket", "about", "logout", "bookings"]):
            print(f"{i}: {line.strip()}")
