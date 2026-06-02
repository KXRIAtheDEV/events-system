// ============================================
// COMPLETE MOCK DATA - Events, Categories, Reviews
// ============================================

const MOCK_EVENTS_DATA = {
    // Categories with full details
    categories: [
        { id: "music", name: "Music", icon: "fa-music", color: "#f59e0b", description: "Live concerts, music festivals, and DJ nights", event_count: 8 },
        { id: "technology", name: "Technology", icon: "fa-microchip", color: "#3b82f6", description: "Tech conferences, workshops, and hackathons", event_count: 6 },
        { id: "sports", name: "Sports", icon: "fa-futbol", color: "#10b981", description: "Sports tournaments, marathons, and fitness events", event_count: 5 },
        { id: "food", name: "Food & Drink", icon: "fa-utensils", color: "#ef4444", description: "Food festivals, wine tasting, and culinary events", event_count: 7 },
        { id: "arts", name: "Arts", icon: "fa-palette", color: "#8b5cf6", description: "Art exhibitions, theater, and cultural events", event_count: 4 },
        { id: "business", name: "Business", icon: "fa-briefcase", color: "#06b6d4", description: "Business conferences, networking, and workshops", event_count: 6 }
    ],
    
    // Complete Events Data
    events: [
        {
            id: 1,
            title: "Summer Music Festival 2026",
            slug: "summer-music-festival-2026",
            category: "music",
            category_name: "Music",
            date: "2026-06-15",
            time: "2:00 PM",
            end_time: "11:00 PM",
            location: "Uhuru Gardens, Nairobi",
            venue: "Uhuru Gardens Main Stage",
            price: 2500,
            original_price: 5000,
            available_tickets: 150,
            total_capacity: 500,
            image: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?w=1200",
            description: "Experience the biggest music festival of the year featuring top local and international artists. Get ready for an unforgettable night of music, dancing, and entertainment. Featuring 10+ artists across 3 stages.",
            short_description: "The biggest music festival of the year with top artists",
            organizer: "EventHub Entertainment",
            organizer_email: "events@eventhub.com",
            organizer_phone: "+254 700 000000",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: true,
            is_virtual: false,
            age_restriction: "18+",
            parking_available: true,
            wheelchair_accessible: true,
            refund_policy: "Non-refundable within 7 days of event",
            features: [
                "10+ Live Music Performances",
                "3 Stages with Different Genres",
                "Food & Drink Vendors",
                "VIP Lounge Access",
                "Free Parking Available",
                "Security on Site",
                "First Aid Station",
                "Charging Stations",
                "Photo Booth",
                "Merchandise Store"
            ],
            coordinates: { lat: -1.2921, lng: 36.8219 },
            reviews: [],
            rating: 4.8,
            review_count: 234
        },
        {
            id: 2,
            title: "Tech Innovation Summit 2026",
            slug: "tech-innovation-summit-2026",
            category: "technology",
            category_name: "Technology",
            date: "2026-07-20",
            time: "9:00 AM",
            end_time: "6:00 PM",
            location: "KICC, Nairobi",
            venue: "KICC Conference Hall",
            price: 5000,
            original_price: 8000,
            available_tickets: 200,
            total_capacity: 400,
            image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?w=1200",
            description: "Join industry leaders for inspiring talks and networking opportunities. Learn about AI, Blockchain, Cloud Computing, and more. Perfect for tech enthusiasts and professionals.",
            short_description: "Kenya's premier technology conference",
            organizer: "TechHub Kenya",
            organizer_email: "info@techhub.co.ke",
            organizer_phone: "+254 700 111111",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: true,
            is_virtual: true,
            virtual_link: "https://zoom.us/techsummit2026",
            age_restriction: "None",
            parking_available: true,
            wheelchair_accessible: true,
            refund_policy: "Full refund within 14 days",
            features: [
                "Keynote Speeches from Industry Leaders",
                "Hands-on Workshops",
                "Networking Sessions",
                "Exhibition Area",
                "Lunch Included",
                "Certificate of Participation",
                "Q&A Sessions",
                "Startup Pitch Competition",
                "Career Fair",
                "Goodie Bag"
            ],
            coordinates: { lat: -1.2889, lng: 36.8233 },
            reviews: [],
            rating: 4.9,
            review_count: 156
        },
        {
            id: 3,
            title: "Marathon Kenya 2026",
            slug: "marathon-kenya-2026",
            category: "sports",
            category_name: "Sports",
            date: "2026-08-10",
            time: "6:00 AM",
            end_time: "12:00 PM",
            location: "Eldoret Sports Complex, Eldoret",
            venue: "Eldoret Sports Complex",
            price: 1500,
            original_price: 2500,
            available_tickets: 500,
            total_capacity: 1000,
            image: "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?w=1200",
            description: "Run through scenic landscapes while supporting local charities. Categories: 5km, 10km, 21km, and 42km. All participants receive medals and t-shirts.",
            short_description: "Annual charity marathon supporting local causes",
            organizer: "Athletics Kenya",
            organizer_email: "info@athleticskenya.or.ke",
            organizer_phone: "+254 700 222222",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: true,
            is_virtual: false,
            age_restriction: "All ages",
            parking_available: true,
            wheelchair_accessible: true,
            refund_policy: "No refunds after registration",
            features: [
                "Medal for All Finishers",
                "Water Stations Every 3km",
                "Medical Support Throughout",
                "Baggage Storage",
                "Cash Prizes for Winners",
                "Event T-shirts",
                "Pacers Available",
                "Post-race Breakfast",
                "Massage Services",
                "Family Fun Area"
            ],
            coordinates: { lat: 0.5143, lng: 35.2698 },
            reviews: [],
            rating: 4.7,
            review_count: 89
        },
        {
            id: 4,
            title: "Food & Wine Expo 2026",
            slug: "food-wine-expo-2026",
            category: "food",
            category_name: "Food & Drink",
            date: "2026-09-05",
            time: "11:00 AM",
            end_time: "8:00 PM",
            location: "Sarit Expo Centre, Nairobi",
            venue: "Sarit Expo Centre",
            price: 3000,
            original_price: 4500,
            available_tickets: 180,
            total_capacity: 300,
            image: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?w=1200",
            description: "Sample delicious cuisines from top chefs and explore fine wines from around the world. Meet celebrity chefs and learn cooking techniques.",
            short_description: "The ultimate culinary experience",
            organizer: "Gourmet Events",
            organizer_email: "info@gourmetevents.co.ke",
            organizer_phone: "+254 700 333333",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: false,
            is_virtual: false,
            age_restriction: "18+ (for wine tasting)",
            parking_available: true,
            wheelchair_accessible: true,
            refund_policy: "Partial refund available",
            features: [
                "Wine Tasting from 20+ Vineyards",
                "Cooking Demonstrations",
                "Chef Meet & Greet",
                "Live Music Entertainment",
                "Goodie Bag with Samples",
                "Photo Booth",
                "Cooking Competitions",
                "Food Trucks",
                "Beer Garden",
                "Dessert Festival"
            ],
            coordinates: { lat: -1.2711, lng: 36.8022 },
            reviews: [],
            rating: 4.6,
            review_count: 203
        },
        {
            id: 5,
            title: "Contemporary Art Exhibition",
            slug: "contemporary-art-exhibition",
            category: "arts",
            category_name: "Arts",
            date: "2026-10-12",
            time: "10:00 AM",
            end_time: "7:00 PM",
            location: "Nairobi National Museum, Nairobi",
            venue: "Museum Gallery",
            price: 1000,
            original_price: 1500,
            available_tickets: 250,
            total_capacity: 400,
            image: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?w=1200",
            description: "Experience stunning artworks from established and emerging artists. Paintings, sculptures, and mixed media installations.",
            short_description: "Showcasing the best of contemporary African art",
            organizer: "Nairobi Arts Council",
            organizer_email: "info@nairobiarts.or.ke",
            organizer_phone: "+254 700 444444",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: false,
            is_virtual: false,
            age_restriction: "All ages",
            parking_available: true,
            wheelchair_accessible: true,
            refund_policy: "Full refund before event",
            features: [
                "Paintings Exhibition",
                "Sculpture Garden",
                "Live Demonstrations",
                "Art for Sale",
                "Artist Talks",
                "Refreshments Available",
                "Guided Tours",
                "Kids Art Corner",
                "Photography Allowed",
                "Catalogue Included"
            ],
            coordinates: { lat: -1.2874, lng: 36.8178 },
            reviews: [],
            rating: 4.5,
            review_count: 67
        },
        {
            id: 6,
            title: "Entrepreneurship Forum 2026",
            slug: "entrepreneurship-forum-2026",
            category: "business",
            category_name: "Business",
            date: "2026-11-08",
            time: "9:00 AM",
            end_time: "5:00 PM",
            location: "Nairobi Serena Hotel, Nairobi",
            venue: "Serena Hotel Conference Center",
            price: 4500,
            original_price: null,
            available_tickets: 120,
            total_capacity: 200,
            image: "https://images.pexels.com/photos/276452/pexels-photo-276452.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/276452/pexels-photo-276452.jpeg?w=1200",
            description: "Learn from successful entrepreneurs and connect with investors. Perfect for startup founders and business owners. Get actionable insights and strategies.",
            short_description: "Connect with investors and successful entrepreneurs",
            organizer: "Startup Grind Kenya",
            organizer_email: "nairobi@startupgrind.com",
            organizer_phone: "+254 700 555555",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: true,
            is_virtual: false,
            age_restriction: "None",
            parking_available: true,
            wheelchair_accessible: true,
            refund_policy: "Full refund 7 days before",
            features: [
                "Panel Discussions",
                "Pitch Sessions",
                "Networking Opportunities",
                "Coffee Break",
                "Investor Meetups",
                "Workshops",
                "One-on-One Mentoring",
                "Resource Materials",
                "Certificate of Attendance",
                "Post-event Reception"
            ],
            coordinates: { lat: -1.2793, lng: 36.8133 },
            reviews: [],
            rating: 4.9,
            review_count: 112
        },
        {
            id: 7,
            title: "Jazz Night Live",
            slug: "jazz-night-live",
            category: "music",
            category_name: "Music",
            date: "2026-12-05",
            time: "7:00 PM",
            end_time: "11:00 PM",
            location: "The Alchemist, Nairobi",
            venue: "The Alchemist Bar",
            price: 2000,
            original_price: null,
            available_tickets: 80,
            total_capacity: 150,
            image: "https://images.pexels.com/photos/210922/pexels-photo-210922.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/210922/pexels-photo-210922.jpeg?w=1200",
            description: "An evening of smooth jazz featuring local and international jazz artists. Perfect for a relaxing night out with friends.",
            short_description: "Smooth jazz with local and international artists",
            organizer: "Jazz Club Kenya",
            organizer_email: "info@jazzclub.co.ke",
            organizer_phone: "+254 700 666666",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: false,
            is_virtual: false,
            age_restriction: "18+",
            parking_available: false,
            wheelchair_accessible: true,
            refund_policy: "No refunds",
            features: [
                "Live Jazz Performances",
                "Cocktail Bar",
                "Food Available",
                "VIP Seating",
                "Meet the Artists",
                "Photo Opportunities",
                "Free Welcome Drink",
                "Parking Nearby",
                "Dress Code: Smart Casual"
            ],
            coordinates: { lat: -1.2756, lng: 36.8068 },
            reviews: [],
            rating: 4.7,
            review_count: 45
        },
        {
            id: 8,
            title: "AI Conference 2026",
            slug: "ai-conference-2026",
            category: "technology",
            category_name: "Technology",
            date: "2027-01-20",
            time: "9:00 AM",
            end_time: "6:00 PM",
            location: "Strathmore University, Nairobi",
            venue: "Strathmore Auditorium",
            price: 8000,
            original_price: 12000,
            available_tickets: 50,
            total_capacity: 200,
            image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?w=600",
            banner_image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?w=1200",
            description: "Explore the future of Artificial Intelligence with industry experts. Learn about machine learning, deep learning, and AI applications.",
            short_description: "The premier AI conference in East Africa",
            organizer: "AI Kenya",
            organizer_email: "info@aikenya.or.ke",
            organizer_phone: "+254 700 777777",
            organizer_logo: "https://via.placeholder.com/80",
            is_featured: false,
            is_virtual: true,
            virtual_link: "https://zoom.us/aiconference2026",
            age_restriction: "None",
            parking_available: true,
            wheelchair_accessible: true,
            refund_policy: "Full refund 30 days before",
            features: [
                "Keynote Speeches from AI Experts",
                "Technical Workshops",
                "Networking Sessions",
                "AI Exhibition",
                "Career Fair",
                "Lunch Included",
                "Certificate of Completion",
                "Post-conference Materials",
                "Q&A Panels",
                "Startup Showcase"
            ],
            coordinates: { lat: -1.2995, lng: 36.7809 },
            reviews: [],
            rating: 4.8,
            review_count: 78
        }
    ],
    
    // User Reviews Storage
    user_reviews: {},
    
    // Featured Events
    getFeaturedEvents: function() {
        return this.events.filter(event => event.is_featured === true);
    },
    
    // Get event by ID
    getEventById: function(id) {
        return this.events.find(event => event.id === parseInt(id));
    },
    
    // Get events by category
    getEventsByCategory: function(category) {
        if (!category || category === 'all') return this.events;
        return this.events.filter(event => event.category === category);
    },
    
    // Get events by location
    getEventsByLocation: function(location) {
        if (!location) return this.events;
        return this.events.filter(event => event.location.toLowerCase().includes(location.toLowerCase()));
    },
    
    // Search events
    searchEvents: function(query) {
        if (!query) return this.events;
        const lowerQuery = query.toLowerCase();
        return this.events.filter(event => 
            event.title.toLowerCase().includes(lowerQuery) ||
            event.category_name.toLowerCase().includes(lowerQuery) ||
            event.location.toLowerCase().includes(lowerQuery) ||
            event.description.toLowerCase().includes(lowerQuery) ||
            event.organizer.toLowerCase().includes(lowerQuery)
        );
    },
    
    // Get upcoming events (today's date or future)
    getUpcomingEvents: function() {
        const today = new Date();
        return this.events.filter(event => new Date(event.date) >= today);
    },
    
    // Get events by price range
    getEventsByPriceRange: function(min, max) {
        return this.events.filter(event => event.price >= min && event.price <= max);
    },
    
    // Get available tickets count
    getAvailableTicketsCount: function(eventId) {
        const event = this.getEventById(eventId);
        return event ? event.available_tickets : 0;
    },
    
    // Update available tickets (when booking)
    updateAvailableTickets: function(eventId, quantity) {
        const event = this.getEventById(eventId);
        if (event && event.available_tickets >= quantity) {
            event.available_tickets -= quantity;
            return true;
        }
        return false;
    },
    
    // Reviews functions
    getReviews: function(eventId) {
        return this.user_reviews[eventId] || [];
    },
    
    addReview: function(eventId, review) {
        if (!this.user_reviews[eventId]) {
            this.user_reviews[eventId] = [];
        }
        review.id = Date.now();
        review.created_at = new Date().toISOString();
        this.user_reviews[eventId].unshift(review);
        
        // Update event rating
        this.updateEventRating(eventId);
        
        // Save to localStorage
        this.saveReviews();
        return review;
    },
    
    updateEventRating: function(eventId) {
        const reviews = this.getReviews(eventId);
        if (reviews.length === 0) return;
        
        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        const average = total / reviews.length;
        
        const event = this.getEventById(eventId);
        if (event) {
            event.rating = parseFloat(average.toFixed(1));
            event.review_count = reviews.length;
        }
    },
    
    saveReviews: function() {
        localStorage.setItem('eventhub_user_reviews', JSON.stringify(this.user_reviews));
    },
    
    loadReviews: function() {
        const saved = localStorage.getItem('eventhub_user_reviews');
        if (saved) {
            this.user_reviews = JSON.parse(saved);
            // Update ratings for all events
            Object.keys(this.user_reviews).forEach(eventId => {
                this.updateEventRating(parseInt(eventId));
            });
        }
    }
};

// Load saved reviews on initialization
MOCK_EVENTS_DATA.loadReviews();

// Make available globally
window.MOCK_EVENTS_DATA = MOCK_EVENTS_DATA;

console.log('✅ Mock data loaded:', MOCK_EVENTS_DATA.events.length, 'events,', MOCK_EVENTS_DATA.categories.length, 'categories');
