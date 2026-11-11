/*
 * WEDDING DETAILS — the only file you need to edit.
 * Change a time, venue or number here and the whole invitation updates:
 * the cards, map buttons, calendar entries, RSVP links and share text.
 *
 * Everything below is copied from the printed card, spelling included.
 */
window.WEDDING = {
  // The final public link, e.g. "https://haroon-shaheera.example.com/".
  // Used by the Share button. Leave "" to share whatever address the page is opened from.
  siteUrl: "https://mdgoaltech-web.github.io/haroon-shaheera/",

  // true  = show the "For your review" notes at the top of the page (for you).
  // false = hide them (set this before you send the link to guests).
  showReviewNotes: false,

  // Calendar entries are saved in Pakistan time.
  timezone: "Asia/Karachi",
  utcOffset: "+0500",

  couple: {
    groom: "Haroon Khurshid",
    joiner: "with",
    bride: "Shaheera Chaudhry",
    seal: "H · S", // initials on the wax seal
  },

  invitation: {
    // The card opens with a calligraphic Bismillah; it is set here as Arabic text.
    greeting: { text: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ", lang: "ar", dir: "rtl" },
    hosts: "Mr. & Mrs. Khurshid Zafar",
    wording: "Request the honour of your gracious presence at the wedding celebration of their beloved son.",
    closing: "Looking forward to the gracious presence of all our respected family members and relatives.",
  },

  /*
   * VENUES
   * pinVerified: true  -> "Open in Maps" is shown.
   * pinVerified: false -> the button is switched off and only the printed address is shown.
   * mapsUrl: optional. Paste a Google Maps share link to send guests to an exact pin.
   *          If empty, the button searches Google Maps for mapsQuery.
   */
  venues: {
    nawab: {
      name: "Nawab Marquee",
      address: "Burewala road, Vehari",
      mapsQuery: "Nawab Marquee Burewala Road Vehari",
      mapsUrl: "https://maps.app.goo.gl/ochdmv3rLsVMNgPc8", // pin supplied and confirmed by the family
      pinVerified: true,
    },
    house: {
      name: "House 160, New Danewal Town",
      address: "Near city cold store, Vehari",
      mapsQuery: "",
      mapsUrl: "https://maps.app.goo.gl/3t19Yj3wcNnVYVfq9", // pin supplied by the family
      pinVerified: true,
    },
    shafaq: {
      name: "Shafaq Lucky Marquee",
      address: "Burewala Road, Vehari",
      mapsQuery: "Shafaq Lucky Marquee Burewala Road Vehari",
      mapsUrl: "https://maps.app.goo.gl/4u6Zf6DQ41yA1NMPA", // pin supplied and confirmed by the family
      pinVerified: true,
    },
  },

  /*
   * EVENTS — shown in this order.
   * day:  the day exactly as printed.     date: YYYY-MM-DD.
   * If the printed day does not match the date, "Add to Calendar" switches itself off
   * for that event until you correct day/date here (or set dateConfirmed: true).
   * programme: times as printed. The first time is used as the calendar start.
   *            No end time is added.
   */
  events: [
    {
      id: "rasm-e-hina",
      name: "Rasm e Hina",
      intro: "Laiba & Amna cordially invite you to the Rasm e Hina of their beloved brother.",
      day: "Thursday",
      date: "2027-01-07",
      programme: [
        { label: "Mehndi", time: "06:00 pm" },
        { label: "Sehra Bandi", time: "09:00 pm" },
      ],
      venue: "nawab",
    },
    {
      id: "barat",
      name: "Barat",
      intro: "We warmly invite you to share in the joy and blessings of our beloved son's Barat.",
      day: "Friday",
      date: "2027-01-08",
      programme: [
        { label: "Gathering", time: "07:00 am" },
        { label: "Departure", time: "07:30 am" },
      ],
      venue: "house",
    },
    {
      id: "bazm-e-sama",
      name: "Bazm-e-Sama",
      intro: "Hamza & Hammad invite you to the Bazm-e-Sama of their beloved brother.",
      day: "Saturday", // the card prints "Sunday"; confirmed as Saturday 9 January 2027.
      date: "2027-01-09",
      programme: [
        { label: "Dinner", time: "06:00 pm" },
        { label: "Qawwali", time: "07:00 pm" },
      ],
      venue: "nawab",
    },
    {
      id: "dawat-e-walima",
      name: "Dawat-e-Walima",
      intro: "Haroon Khurshid with Shaheera Chaudhry",
      day: "Sunday",
      date: "2027-01-10",
      programme: [
        { label: "Reception", time: "01:00 pm" },
        { label: "Lunch", time: "02:00 pm" },
      ],
      venue: "shafaq",
    },
  ],

  rsvp: {
    heading: "R.S.V.P.",
    // display: as printed.  intl: the same number in international format, digits only.
    // whatsapp: set to false for a number that is not on WhatsApp.
    numbers: [
      { display: "0317-6956559", intl: "923176956559", whatsapp: true },
      { display: "0311-6277028", intl: "923116277028", whatsapp: true },
    ],
    // Guests can edit this before sending.
    message:
      "Assalam-o-Alaikum! Thank you for the invitation to the wedding of Haroon Khurshid with Shaheera Chaudhry.\n\nName: \nNumber of guests: \nAttending: ",
  },

  share: {
    title: "Haroon Khurshid with Shaheera Chaudhry · Wedding Invitation",
    text: "You are invited to the wedding celebration of Haroon Khurshid with Shaheera Chaudhry.",
  },

  // Scans of the printed card, shown under "The Printed Card".
  cardPages: [
    { src: "assets/card/01-invitation.jpg", caption: "Invitation", w: 879, h: 1141 },
    { src: "assets/card/02-rasm-e-hina.jpg", caption: "Rasm e Hina", w: 1008, h: 988 },
    { src: "assets/card/03-barat.jpg", caption: "Barat", w: 873, h: 847 },
    { src: "assets/card/04-bazm-e-sama.jpg", caption: "Bazm-e-Sama", w: 669, h: 653 },
    { src: "assets/card/05-walima.jpg", caption: "Dawat-e-Walima", w: 877, h: 1138 },
  ],
};
