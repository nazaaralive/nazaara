// Hero Section Content
export interface HeroContent {
  backgroundImage: string;
  title: string;
  subtitle: string;
  description: string;
}

export const heroContent: HeroContent = {
  backgroundImage: "/bookings-bg.webp",
  title: "Book the",
  subtitle: "Spectacle",
  description: "The artists who pack our floors are available for yours. Browse the roster, tell us your date, and we'll take it from there."
};

// Private Events Section Content
export interface ServiceDetail {
  icon: string;
  title: string;
  description: string;
}

export interface PrivateEventsContent {
  sectionTitle: string;
  heading: string;
  subHeading: string;
  description: string;
  services: ServiceDetail[];
  ctaButtonText: string;
  images: {
    primary: string;
    secondary: string;
  };
}

export const privateEventsContent: PrivateEventsContent = {
  sectionTitle: "Private Services",
  heading: "Your Occasion.",
  subHeading: "Our Spectacle.",
  description: "Weddings, private parties, corporate nights: we bring the same energy that sells out our shows to rooms of fifty or five thousand. Tell us the moment you're planning and we'll build the experience around it.",
  services: [
    {
      icon: "Star",
      title: "Bollywood A-Listers",
      description: "Direct lines to India's biggest stars for the occasion that calls for one."
    },
    {
      icon: "Crown",
      title: "International Artists",
      description: "South Asian headliners from every scene, booked for your stage."
    },
    {
      icon: "Users",
      title: "Private Concerts",
      description: "Full production, intimate rooms, and an artist your guests will never forget."
    }
  ],
  ctaButtonText: "Book a Consultation",
  images: {
    primary: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    secondary: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
  }
};

// Artist Roster Section Content
export interface DJRosterContent {
  sectionTitle: string;
  heading: string;
  description: string;
}

export const djRosterContent: DJRosterContent = {
  sectionTitle: "Available Artists",
  heading: "Artist Roster",
  description: "Artists available for private bookings worldwide"
};

// Contact Form Section Content
export interface ContactInfoItem {
  title: string;
  description: string;
}

export interface FormField {
  label: string;
  placeholder: string;
  type: string;
}

export interface ContactFormContent {
  sectionTitle: string;
  heading: string;
  subHeading: string;
  description: string;
  contactInfo: ContactInfoItem[];
  contactEmail: {
    label: string;
    email: string;
  };
  formFields: {
    personalInfo: FormField[];
    eventDetails: FormField[];
    locationAndScale: FormField[];
    vision: {
      label: string;
      placeholder: string;
      rows: number;
    };
  };
  privacyNote: string;
  submitButtonText: string;
}

export const contactFormContent: ContactFormContent = {
  sectionTitle: "Start the Conversation",
  heading: "Let's Build",
  subHeading: "Your Experience",
  description: "Every Nazaara event starts with a short conversation. Give us the basics and we'll come back within a day with availability and ideas.",
  contactInfo: [
    {
      title: "What We Need",
      description: "Event type, date, location, and guest count to get started"
    },
    {
      title: "Response Time",
      description: "We typically respond within 24 hours with initial availability"
    }
  ],
  contactEmail: {
    label: "Preferred contact for urgent bookings",
    email: "bookings@nazaara.live"
  },
  formFields: {
    personalInfo: [
      {
        label: "Full Name",
        placeholder: "John Doe",
        type: "text"
      },
      {
        label: "Email Address",
        placeholder: "john@example.com",
        type: "email"
      }
    ],
    eventDetails: [
      {
        label: "Event Type",
        placeholder: "Wedding, Corporate Event, etc.",
        type: "text"
      },
      {
        label: "Event Date",
        placeholder: "MM/DD/YYYY",
        type: "text"
      }
    ],
    locationAndScale: [
      {
        label: "Event Location",
        placeholder: "City, Country",
        type: "text"
      },
      {
        label: "Expected Guests",
        placeholder: "500",
        type: "text"
      }
    ],
    vision: {
      label: "Your Vision",
      placeholder: "Share your dream event details, special requirements, and artistic preferences...",
      rows: 4
    }
  },
  privacyNote: "Your information is kept strictly confidential and used solely for event planning purposes.",
  submitButtonText: "Send Inquiry"
};
