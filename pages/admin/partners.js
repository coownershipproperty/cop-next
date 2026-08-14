import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
const partnerContact = { firstName: "David", lastName: "Olsson", email: "davson@hotmail.com", phone: "+34 626 786 678" };
const partnerDirectory = {
  "21-5": partnerContact,
  "Vivla": { firstName: "Vivla", lastName: "Preview", email: "info@co-ownership-property.com", phone: "+34 626 786 678", testRouting: true }
};
const vivlaRegions = [
  "Mallorca",
  "Ibiza",
  "Costa del Sol",
  "Baqueira",
  "Menorca",
  "Costa Blanca",
  "Cantabria",
  "Costa de la Luz",
  "Tenerife",
  "Asturias",
  "Madrid"
];
const budgetOptions = [
  { value: "50000", label: "50,000" },
  { value: "100000", label: "100,000" },
  { value: "150000", label: "150,000" },
  { value: "200000", label: "200,000" },
  { value: "250000", label: "250,000" },
  { value: "300000", label: "300,000" },
  { value: "500000", label: "500,000" },
  { value: "750000", label: "750,000" },
  { value: "1000000", label: "1 million" },
  { value: "2000000", label: "2 million" }
];
const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Republic of the Congo",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "S\xE3o Tom\xE9 and Pr\xEDncipe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];
const leadCountryOptions = ["United Kingdom", "USA", ...countries.filter((country) => country !== "United Kingdom" && country !== "United States")];
const leads = [
  { initials: "ET", name: "Emma Thompson", email: "emma.thompson@example.com", phone: "+44 7700 900 142", nationality: "United Kingdom", collection: "City Retreats", location: "Mallorca", partner: "21-5", stage: "Unable to contact", age: "12 min ago", budget: "\u20AC350,000", note: "Looking for a 2\u20133 bedroom home with sea views. Prefers email for the first introduction." },
  { initials: "LN", name: "Lars Nystr\xF6m", email: "lars.nystrom@example.com", phone: "+46 70 123 45 67", nationality: "Sweden", collection: "Large Nordic", location: "C\xF4te d\u2019Azur", partner: "21-5", stage: "Consultation", age: "Yesterday", budget: "\u20AC500,000", note: "Already familiar with co-ownership and ready to arrange an introductory call." },
  { initials: "SR", name: "Sofia Rossi", email: "sofia.rossi@example.com", phone: "+39 320 555 0184", nationality: "Italy", collection: "READY TO GO INT-12", location: "Lake Como", partner: "21-5", stage: "Viewing", age: "2 days ago", budget: "\u20AC420,000", note: "Viewing confirmed for next week. Interested in lake access and a managed property." },
  { initials: "JM", name: "James Miller", email: "james.miller@example.com", phone: "+1 917 555 0142", nationality: "United States", collection: "Beyond", location: "Ibiza", partner: "21-5", stage: "Contract", age: "4 days ago", budget: "\u20AC625,000", note: "Agreement sent. Partner is awaiting proof of funds before countersigning." },
  { initials: "AB", name: "Amelia Brooks", email: "amelia.brooks@example.com", phone: "+44 7700 900 308", nationality: "United Kingdom", collection: "Grande", location: "Marbella", partner: "21-5", stage: "Won", age: "8 days ago", budget: "\u20AC290,000", note: "Closed won. Final share value \u20AC278,000; invoice is ready for review." },
  { initials: "CM", name: "Chloe Martin", email: "chloe.martin@example.com", phone: "+44 7700 900 624", nationality: "United Kingdom", collection: "\u2014", location: "Mallorca", partner: "Vivla", stage: "New", age: "18 min ago", budget: "\u20AC250,000 \u2013 \u20AC300,000", note: "Synthetic preview lead. Interested in a managed home in Mallorca and available for an introductory call next week." },
  { initials: "JM", name: "Javier Morales", email: "javier.morales@example.com", phone: "+34 612 345 870", nationality: "Spain", collection: "\u2014", location: "Costa del Sol, Madrid", partner: "Vivla", stage: "Consultation", age: "Yesterday", budget: "\u20AC500,000 \u2013 \u20AC750,000", note: "Synthetic preview lead. Considering Costa del Sol or Madrid and comparing family-friendly locations." }
];
function PhoneDisplay({ phone }) {
  const [dialCode, ...number] = phone.split(" ");
  return /* @__PURE__ */ jsxs("span", { className: "phone-cell", children: [
    /* @__PURE__ */ jsx("b", { children: dialCode }),
    /* @__PURE__ */ jsx("span", { children: number.join(" ") })
  ] });
}
function Brand() {
  return /* @__PURE__ */ jsxs("span", { className: "brand", "aria-label": "Co-Ownership Property partner hub", children: [
    /* @__PURE__ */ jsx("span", { className: "brand-mark", children: "C" }),
    /* @__PURE__ */ jsxs("span", { children: [
      /* @__PURE__ */ jsx("strong", { children: "CO-OWNERSHIP" }),
      /* @__PURE__ */ jsx("small", { children: "PARTNER HUB" })
    ] })
  ] });
}
function PartnerLogo({ name, mark, big = false }) {
  const logoSrc = name === "21-5" ? "/21-5-logo.svg" : name === "Vivla" ? "/vivla-logo.svg" : null;
  return /* @__PURE__ */ jsx("div", { className: `partner-logo${big ? " big" : ""}${logoSrc ? " has-logo" : ""}${name === "Vivla" ? " vivla-logo" : ""}`, children: logoSrc ? /* @__PURE__ */ jsx("img", { src: logoSrc, alt: name }) : mark });
}
function OverviewView({ leadRecords, onNavigate, onLead }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "dashboard-grid", children: [
      /* @__PURE__ */ jsxs("article", { className: "hero-card", children: [
        /* @__PURE__ */ jsxs("div", { className: "hero-copy", children: [
          /* @__PURE__ */ jsxs("span", { className: "live-pill", children: [
            /* @__PURE__ */ jsx("i", {}),
            " PARTNER PIPELINE"
          ] }),
          /* @__PURE__ */ jsxs("h2", { children: [
            "Keep every opportunity",
            /* @__PURE__ */ jsx("br", {}),
            "moving forward."
          ] }),
          /* @__PURE__ */ jsx("p", { children: "One private workspace for leads, partner updates and invoices \u2014 without the back-and-forth." }),
          /* @__PURE__ */ jsxs("div", { className: "hero-actions", children: [
            /* @__PURE__ */ jsxs("button", { className: "light-button", type: "button", onClick: () => onNavigate("submit"), children: [
              "Submit a lead ",
              /* @__PURE__ */ jsx("span", { children: "\u2197" })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", onClick: () => onNavigate("leads"), children: "View all leads \u2192" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "orbit", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsx("div", { className: "orbit-ring ring-one" }),
          /* @__PURE__ */ jsx("div", { className: "orbit-ring ring-two" }),
          /* @__PURE__ */ jsxs("div", { className: "orbit-core", children: [
            "COP",
            /* @__PURE__ */ jsx("small", { children: "HUB" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "orbit-dot dot-one" }),
          /* @__PURE__ */ jsx("span", { className: "orbit-dot dot-two" }),
          /* @__PURE__ */ jsx("span", { className: "orbit-dot dot-three" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "partner-card", children: [
        /* @__PURE__ */ jsxs("div", { className: "card-heading", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "mini-label", children: "ACTIVE PARTNER" }),
            /* @__PURE__ */ jsx("h3", { children: "21-5" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Partner options", children: "\u2022\u2022\u2022" })
        ] }),
        /* @__PURE__ */ jsx(PartnerLogo, { name: "21-5", mark: "21-5" }),
        /* @__PURE__ */ jsxs("div", { className: "partner-status", children: [
          /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("strong", { children: "Connected" }),
          /* @__PURE__ */ jsx("small", { children: "Last active 24 min ago" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "partner-metrics", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: "16" }),
            /* @__PURE__ */ jsx("small", { children: "Total leads" })
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: "\u20AC1.24m" }),
            /* @__PURE__ */ jsx("small", { children: "Pipeline" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "partner-link", type: "button", onClick: () => onNavigate("partners"), children: [
          "Open partner workspace ",
          /* @__PURE__ */ jsx("span", { children: "\u2192" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "stats-row", "aria-label": "Lead statistics", children: [
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { className: "stat-icon violet", children: "\u2197" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("small", { children: "TOTAL LEADS" }),
          /* @__PURE__ */ jsx("strong", { children: "16" }),
          /* @__PURE__ */ jsx("em", { children: "+12% this month" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { className: "stat-icon blue", children: "\u25D4" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("small", { children: "ACTIVE PIPELINE" }),
          /* @__PURE__ */ jsx("strong", { children: "\u20AC1.24m" }),
          /* @__PURE__ */ jsx("em", { children: "Across 9 leads" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { className: "stat-icon amber", children: "\u2301" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("small", { children: "NEEDS ATTENTION" }),
          /* @__PURE__ */ jsx("strong", { children: "3" }),
          /* @__PURE__ */ jsx("em", { children: "Includes 1 contact issue" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { className: "stat-icon mint", children: "\u2713" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("small", { children: "CLOSED WON" }),
          /* @__PURE__ */ jsx("strong", { children: "3" }),
          /* @__PURE__ */ jsx("em", { children: "\u20AC312k share value" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "content-grid", children: [
      /* @__PURE__ */ jsxs("article", { className: "leads-card", children: [
        /* @__PURE__ */ jsxs("div", { className: "section-heading", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { children: "Recent leads" }),
            /* @__PURE__ */ jsx("p", { children: "Latest activity across your partner network" })
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => onNavigate("leads"), children: [
            "View all ",
            /* @__PURE__ */ jsx("span", { children: "\u2192" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "lead-table", role: "table", "aria-label": "Recent leads", children: [
          /* @__PURE__ */ jsxs("div", { className: "table-row table-head", role: "row", children: [
            /* @__PURE__ */ jsx("span", { children: "LEAD" }),
            /* @__PURE__ */ jsx("span", { children: "DESTINATION" }),
            /* @__PURE__ */ jsx("span", { children: "PARTNER" }),
            /* @__PURE__ */ jsx("span", { children: "STAGE" }),
            /* @__PURE__ */ jsx("span", { children: "UPDATED" })
          ] }),
          leadRecords.slice(0, 4).map((lead) => /* @__PURE__ */ jsxs("button", { className: "table-row clickable-row", type: "button", role: "row", onClick: () => onLead(lead), children: [
            /* @__PURE__ */ jsxs("span", { className: "lead-person", children: [
              /* @__PURE__ */ jsx("i", { children: lead.initials }),
              /* @__PURE__ */ jsx("strong", { children: lead.name })
            ] }),
            /* @__PURE__ */ jsx("span", { children: lead.location }),
            /* @__PURE__ */ jsx("span", { children: lead.partner }),
            /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("b", { className: `stage ${lead.stage.toLowerCase()}`, children: lead.stage }) }),
            /* @__PURE__ */ jsxs("span", { className: "updated", children: [
              lead.age,
              /* @__PURE__ */ jsx("i", { children: "\u203A" })
            ] })
          ] }, lead.name))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "activity-card", children: [
        /* @__PURE__ */ jsxs("div", { className: "section-heading", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { children: "Activity" }),
            /* @__PURE__ */ jsx("p", { children: "What needs your eye" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", children: "\u2022\u2022\u2022" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "activity-item activity-alert", type: "button", onClick: () => leadRecords[0] && onLead(leadRecords[0]), children: [
          /* @__PURE__ */ jsx("span", { className: "activity-bullet coral", children: "!" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Partner could not reach Emma" }),
            /* @__PURE__ */ jsx("p", { children: "21-5 tried by email and phone. COP follow-up requested." }),
            /* @__PURE__ */ jsx("small", { children: "12 MIN AGO \xB7 EMAIL + WHATSAPP SENT" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "activity-item", children: [
          /* @__PURE__ */ jsx("span", { className: "activity-bullet mint", children: "\u2713" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Viewing confirmed" }),
            /* @__PURE__ */ jsx("p", { children: "Sofia Rossi \xB7 Lake Como" }),
            /* @__PURE__ */ jsx("small", { children: "1 HOUR AGO" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "activity-item", children: [
          /* @__PURE__ */ jsx("span", { className: "activity-bullet blue", children: "\u2197" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "New lead shared" }),
            /* @__PURE__ */ jsx("p", { children: "Emma Thompson was notified" }),
            /* @__PURE__ */ jsx("small", { children: "12 MIN AGO" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "activity-action", type: "button", children: "Review notifications \u2192" })
      ] })
    ] })
  ] });
}
function LeadsView({ partnerMode, partnerId, leadRecords, onLead }) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const phoneDigits = query.replace(/\D/g, "");
  const activeFilterCount = Number(Boolean(stageFilter)) + Number(Boolean(collectionFilter));
  const scopedLeads = partnerMode ? leadRecords.filter((lead) => lead.partner === partnerId) : leadRecords;
  const isDestinationPartner = partnerMode && partnerId === "Vivla";
  const visible = scopedLeads.filter((lead) => {
    const identityMatch = !normalizedQuery || `${lead.name} ${lead.email}`.toLowerCase().includes(normalizedQuery);
    const phoneMatch = phoneDigits.length > 0 && lead.phone.replace(/\D/g, "").includes(phoneDigits);
    const stageMatch = !stageFilter || lead.stage === stageFilter;
    const collectionMatch = !collectionFilter || (isDestinationPartner ? lead.location.split(", ").includes(collectionFilter) : lead.collection === collectionFilter);
    return (identityMatch || phoneMatch) && stageMatch && collectionMatch;
  });
  return /* @__PURE__ */ jsxs("section", { className: "view-card full-view", children: [
    /* @__PURE__ */ jsxs("div", { className: "view-intro", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "mini-label", children: partnerMode ? "CO-OWNERSHIP PROPERTY" : "LEAD MANAGEMENT" }),
        /* @__PURE__ */ jsx("h2", { children: partnerMode ? "Your assigned leads from COP" : "All leads" }),
        /* @__PURE__ */ jsx("p", { children: partnerMode ? "Qualified introductions from the specialist agency for fractional ownership." : "Search, review and track every opportunity from introduction to close." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "view-tools", children: [
        /* @__PURE__ */ jsxs("label", { className: "search-box", children: [
          /* @__PURE__ */ jsx("span", { children: "\u2315" }),
          /* @__PURE__ */ jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Name, email or phone digits\u2026", "aria-label": "Search by first name, surname, email or phone digits" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: filtersOpen || activeFilterCount ? "active" : "", type: "button", "aria-expanded": filtersOpen, "aria-controls": "lead-filters", onClick: () => setFiltersOpen(!filtersOpen), children: [
          "Filter",
          activeFilterCount ? ` (${activeFilterCount})` : ""
        ] })
      ] })
    ] }),
    filtersOpen && /* @__PURE__ */ jsxs("div", { className: "filter-panel", id: "lead-filters", children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "Pipeline stage",
        /* @__PURE__ */ jsxs("select", { value: stageFilter, onChange: (event) => setStageFilter(event.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "All stages" }),
          /* @__PURE__ */ jsx("option", { children: "New" }),
          /* @__PURE__ */ jsx("option", { children: "Consultation" }),
          /* @__PURE__ */ jsx("option", { children: "Viewing" }),
          /* @__PURE__ */ jsx("option", { children: "Contract" }),
          /* @__PURE__ */ jsx("option", { children: "Won" }),
          /* @__PURE__ */ jsx("option", { children: "Unable to contact" }),
          /* @__PURE__ */ jsx("option", { children: "Closed Lost" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        isDestinationPartner ? "Destination" : "Collection type",
        /* @__PURE__ */ jsxs("select", { value: collectionFilter, onChange: (event) => setCollectionFilter(event.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: isDestinationPartner ? "All destinations" : "All collections" }),
          isDestinationPartner ? vivlaRegions.map((region) => /* @__PURE__ */ jsx("option", { children: region }, region)) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("option", { children: "City Retreats" }),
            /* @__PURE__ */ jsx("option", { children: "Large" }),
            /* @__PURE__ */ jsx("option", { children: "Large Nordic" }),
            /* @__PURE__ */ jsx("option", { children: "Grande" }),
            /* @__PURE__ */ jsx("option", { children: "Beyond" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-7" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-10" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-12" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-14" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", disabled: !activeFilterCount, onClick: () => {
        setStageFilter("");
        setCollectionFilter("");
      }, children: "Clear filters" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "large-table", role: "table", "aria-label": "Leads", children: [
      partnerMode ? /* @__PURE__ */ jsxs("div", { className: "large-table-row partner-table-row large-table-head", role: "row", children: [
        /* @__PURE__ */ jsx("span", { children: "LEAD NAME" }),
        /* @__PURE__ */ jsx("span", { children: "EMAIL" }),
        /* @__PURE__ */ jsx("span", { children: "PHONE" }),
        /* @__PURE__ */ jsx("span", { children: "NATIONALITY" }),
        /* @__PURE__ */ jsx("span", { children: isDestinationPartner ? "DESTINATION" : "COLLECTION" }),
        /* @__PURE__ */ jsx("span", { children: "STAGE" }),
        /* @__PURE__ */ jsx("span", { children: "UPDATED" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "large-table-row large-table-head", role: "row", children: [
        /* @__PURE__ */ jsx("span", { children: "LEAD" }),
        /* @__PURE__ */ jsx("span", { children: "DESTINATION" }),
        /* @__PURE__ */ jsx("span", { children: "BUDGET" }),
        /* @__PURE__ */ jsx("span", { children: "STAGE" }),
        /* @__PURE__ */ jsx("span", { children: "UPDATED" })
      ] }),
      visible.map((lead) => partnerMode ? /* @__PURE__ */ jsxs("button", { className: "large-table-row partner-table-row", type: "button", role: "row", onClick: () => onLead(lead), children: [
        /* @__PURE__ */ jsxs("span", { className: "lead-person", children: [
          /* @__PURE__ */ jsx("i", { children: lead.initials }),
          /* @__PURE__ */ jsx("strong", { children: lead.name })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "email-cell", children: lead.email }),
        /* @__PURE__ */ jsx(PhoneDisplay, { phone: lead.phone }),
        /* @__PURE__ */ jsx("span", { children: lead.nationality || "\u2014" }),
        /* @__PURE__ */ jsx("span", { className: "collection-cell", children: isDestinationPartner ? lead.location : lead.collection }),
        /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("b", { className: `stage ${lead.stage.toLowerCase()}`, children: lead.stage }) }),
        /* @__PURE__ */ jsxs("span", { className: "updated", children: [
          lead.age,
          /* @__PURE__ */ jsx("i", { children: "\u203A" })
        ] })
      ] }, lead.name) : /* @__PURE__ */ jsxs("button", { className: "large-table-row", type: "button", role: "row", onClick: () => onLead(lead), children: [
        /* @__PURE__ */ jsxs("span", { className: "lead-person", children: [
          /* @__PURE__ */ jsx("i", { children: lead.initials }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: lead.name }),
            /* @__PURE__ */ jsx("small", { children: lead.email })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { children: lead.location }),
        /* @__PURE__ */ jsx("span", { children: lead.budget }),
        /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("b", { className: `stage ${lead.stage.toLowerCase()}`, children: lead.stage }) }),
        /* @__PURE__ */ jsxs("span", { className: "updated", children: [
          lead.age,
          /* @__PURE__ */ jsx("i", { children: "\u203A" })
        ] })
      ] }, lead.name)),
      !visible.length && /* @__PURE__ */ jsxs("div", { className: "empty-leads", children: [
        /* @__PURE__ */ jsx("span", { children: "\u2315" }),
        /* @__PURE__ */ jsx("strong", { children: "No leads found" }),
        /* @__PURE__ */ jsx("p", { children: "Try another name, email, phone number, or clear the filters." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "table-footer", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Showing ",
        visible.length,
        " of ",
        scopedLeads.length,
        " leads"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        "\u2039 ",
        /* @__PURE__ */ jsx("b", { children: "1" }),
        " \u203A"
      ] })
    ] })
  ] });
}
function SubmitView({ partnerContacts, onDone }) {
  const [email, setEmail] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [regionError, setRegionError] = useState("");
  const selectedContact = selectedPartner ? partnerContacts[selectedPartner] : void 0;
  function selectPartner(partner) {
    const contact = partner ? partnerContacts[partner] : void 0;
    setSelectedPartner(partner);
    setSelectedRegions([]);
    setRegionError("");
    setEmail(Boolean(contact?.email));
    setWhatsapp(Boolean(contact?.phone));
  }
  function toggleRegion(region) {
    setSelectedRegions((current) => current.includes(region) ? current.filter((item) => item !== region) : [...current, region]);
    setRegionError("");
  }
  function submit(event) {
    event.preventDefault();
    if (selectedPartner === "Vivla" && selectedRegions.length === 0) {
      setRegionError("Select at least one destination region for Vivla.");
      return;
    }
    if (!selectedPartner) return;
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") || "").trim();
    const lastName = String(data.get("lastName") || "").trim();
    const budgetFrom = String(data.get("budgetFrom") || "");
    const budgetTo = String(data.get("budgetTo") || "");
    const formatBudget = (value) => value ? `\u20AC${Number(value).toLocaleString("en-GB")}` : "";
    const budget = budgetFrom && budgetTo ? `${formatBudget(budgetFrom)} \u2013 ${formatBudget(budgetTo)}` : formatBudget(budgetFrom || budgetTo) || "Not specified";
    const propertyPreferences = String(data.get("propertyPreferences") || "").trim();
    const partnerNote = String(data.get("partnerNote") || "").trim();
    const newLead = {
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
      name: `${firstName} ${lastName}`.trim(),
      email: String(data.get("email") || "").trim(),
      phone: `${String(data.get("dialCode") || "")} ${String(data.get("phone") || "").trim()}`.trim(),
      nationality: String(data.get("nationality") || "").trim(),
      collection: selectedPartner === "21-5" ? String(data.get("collectionType") || "") : "\u2014",
      location: selectedPartner === "Vivla" ? selectedRegions.join(", ") : "Multiple locations",
      partner: selectedPartner,
      stage: "New",
      age: "Just now",
      budget,
      note: [propertyPreferences, partnerNote].filter(Boolean).join(" ") || "New lead shared from the COP admin preview."
    };
    onDone(selectedPartner, newLead);
  }
  return /* @__PURE__ */ jsxs("section", { className: "submit-layout", children: [
    /* @__PURE__ */ jsxs("form", { className: "view-card lead-form", onSubmit: submit, children: [
      /* @__PURE__ */ jsxs("div", { className: "view-intro", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "mini-label", children: "ADMIN WORKSPACE" }),
          /* @__PURE__ */ jsx("h2", { children: "Share a new lead" }),
          /* @__PURE__ */ jsx("p", { children: "The selected partner will receive a private, secure notification." })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "step-pill", children: "1 OF 1" })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "partner-assignment", children: [
        /* @__PURE__ */ jsx("legend", { children: "Partner assignment" }),
        /* @__PURE__ */ jsxs("div", { className: "assignment-grid", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Assign to partner ",
            /* @__PURE__ */ jsx("small", { children: "Required before entering or sending the lead" }),
            /* @__PURE__ */ jsxs("select", { required: true, value: selectedPartner, onChange: (event) => selectPartner(event.target.value), children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Choose a partner first" }),
              /* @__PURE__ */ jsx("option", { value: "21-5", children: "21-5" }),
              /* @__PURE__ */ jsx("option", { value: "Vivla", children: "Vivla \u2014 mock preview" })
            ] })
          ] }),
          selectedPartner ? /* @__PURE__ */ jsxs("div", { className: `assignment-recipient ${selectedContact?.email && selectedContact?.phone ? "ready" : "incomplete"}`, children: [
            /* @__PURE__ */ jsx("span", { children: selectedContact?.email && selectedContact?.phone ? "\u2713" : "!" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: selectedContact?.testRouting ? "Vivla mock routing is safe" : `${selectedPartner} notification details confirmed` }),
              /* @__PURE__ */ jsxs("small", { children: [
                selectedContact?.email || "Email required",
                " \xB7 ",
                selectedContact?.phone || "WhatsApp number required",
                selectedContact?.testRouting ? " \xB7 COP test recipients only" : ""
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "assignment-prompt", children: [
            /* @__PURE__ */ jsx("span", { children: "1" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Select the partner before entering the lead" }),
              /* @__PURE__ */ jsx("small", { children: "The notification recipients are loaded from that partner\u2019s account." })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { disabled: !selectedPartner, className: !selectedPartner ? "form-section-locked" : "", children: [
        /* @__PURE__ */ jsx("legend", { children: "Contact details" }),
        /* @__PURE__ */ jsxs("div", { className: "form-grid", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "First name",
            /* @__PURE__ */ jsx("input", { required: true, name: "firstName", placeholder: "e.g. Olivia" })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "Last name",
            /* @__PURE__ */ jsx("input", { required: true, name: "lastName", placeholder: "e.g. Bennett" })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "Email address",
            /* @__PURE__ */ jsx("input", { required: true, name: "email", type: "email", placeholder: "olivia@example.com" })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "Phone number",
            /* @__PURE__ */ jsxs("div", { className: "phone-field", children: [
              /* @__PURE__ */ jsxs("select", { name: "dialCode", defaultValue: "+44", "aria-label": "Country dialling code", children: [
                /* @__PURE__ */ jsx("option", { value: "+44", children: "\u{1F1EC}\u{1F1E7} +44" }),
                /* @__PURE__ */ jsx("option", { value: "+1", children: "\u{1F1FA}\u{1F1F8} +1" }),
                /* @__PURE__ */ jsx("option", { value: "+33", children: "\u{1F1EB}\u{1F1F7} +33" }),
                /* @__PURE__ */ jsx("option", { value: "+34", children: "\u{1F1EA}\u{1F1F8} +34" }),
                /* @__PURE__ */ jsx("option", { value: "+39", children: "\u{1F1EE}\u{1F1F9} +39" }),
                /* @__PURE__ */ jsx("option", { value: "+49", children: "\u{1F1E9}\u{1F1EA} +49" }),
                /* @__PURE__ */ jsx("option", { value: "+46", children: "\u{1F1F8}\u{1F1EA} +46" }),
                /* @__PURE__ */ jsx("option", { value: "+47", children: "\u{1F1F3}\u{1F1F4} +47" }),
                /* @__PURE__ */ jsx("option", { value: "+45", children: "\u{1F1E9}\u{1F1F0} +45" }),
                /* @__PURE__ */ jsx("option", { value: "+31", children: "\u{1F1F3}\u{1F1F1} +31" }),
                /* @__PURE__ */ jsx("option", { value: "+41", children: "\u{1F1E8}\u{1F1ED} +41" }),
                /* @__PURE__ */ jsx("option", { value: "+43", children: "\u{1F1E6}\u{1F1F9} +43" }),
                /* @__PURE__ */ jsx("option", { value: "+61", children: "\u{1F1E6}\u{1F1FA} +61" }),
                /* @__PURE__ */ jsx("option", { value: "+971", children: "\u{1F1E6}\u{1F1EA} +971" })
              ] }),
              /* @__PURE__ */ jsx("input", { required: true, name: "phone", type: "tel", inputMode: "tel", autoComplete: "tel-national", placeholder: "7700 900 000", "aria-label": "Phone number" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "wide", children: [
            "Lead nationality ",
            /* @__PURE__ */ jsx("small", { children: "Optional \xB7 type the first two letters" }),
            /* @__PURE__ */ jsx("input", { list: "lead-country-options", name: "nationality", autoComplete: "off", placeholder: "Start typing a country" }),
            /* @__PURE__ */ jsx("datalist", { id: "lead-country-options", children: leadCountryOptions.map((country) => /* @__PURE__ */ jsx("option", { value: country }, country)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { disabled: !selectedPartner, className: !selectedPartner ? "form-section-locked" : "", children: [
        /* @__PURE__ */ jsx("legend", { children: "Opportunity" }),
        /* @__PURE__ */ jsxs("div", { className: "form-grid", children: [
          /* @__PURE__ */ jsxs("label", { className: "wide", children: [
            "Purchase timeframe ",
            /* @__PURE__ */ jsx("small", { children: "Optional \u2014 if known" }),
            /* @__PURE__ */ jsxs("select", { name: "timeframe", defaultValue: "", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Select timeframe" }),
              /* @__PURE__ */ jsx("option", { children: "Immediately" }),
              /* @__PURE__ */ jsx("option", { children: "Within 3 months" }),
              /* @__PURE__ */ jsx("option", { children: "3\u20136 months" }),
              /* @__PURE__ */ jsx("option", { children: "6\u201312 months" }),
              /* @__PURE__ */ jsx("option", { children: "More than 12 months" }),
              /* @__PURE__ */ jsx("option", { children: "Just researching" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "wide form-question", children: [
            /* @__PURE__ */ jsxs("span", { className: "form-label", children: [
              "Approximate budget range ",
              /* @__PURE__ */ jsx("small", { children: "Optional" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "budget-range", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "FROM" }),
                /* @__PURE__ */ jsxs("span", { className: "currency-input", children: [
                  /* @__PURE__ */ jsx("i", { children: "\u20AC" }),
                  /* @__PURE__ */ jsxs("select", { name: "budgetFrom", defaultValue: "", "aria-label": "Minimum approximate budget", children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select minimum" }),
                    budgetOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("b", { children: "\u2014" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "TO" }),
                /* @__PURE__ */ jsxs("span", { className: "currency-input", children: [
                  /* @__PURE__ */ jsx("i", { children: "\u20AC" }),
                  /* @__PURE__ */ jsxs("select", { name: "budgetTo", defaultValue: "", "aria-label": "Maximum approximate budget", children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select maximum" }),
                    budgetOptions.slice(1).map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
                  ] })
                ] })
              ] })
            ] })
          ] }),
          selectedPartner === "21-5" ? /* @__PURE__ */ jsxs("div", { className: "wide form-question", children: [
            /* @__PURE__ */ jsxs("span", { className: "form-label", children: [
              "Type of collection ",
              /* @__PURE__ */ jsx("small", { children: "Choose one" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "collection-options", children: [
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "City Retreats" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "CR" }),
                  /* @__PURE__ */ jsx("strong", { children: "City Retreats" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "Large" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "L" }),
                  /* @__PURE__ */ jsx("strong", { children: "Large" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "Large Nordic" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "LN" }),
                  /* @__PURE__ */ jsx("strong", { children: "Large Nordic" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "Grande" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "G" }),
                  /* @__PURE__ */ jsx("strong", { children: "Grande" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "Beyond" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "B" }),
                  /* @__PURE__ */ jsx("strong", { children: "Beyond" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "READY TO GO INT-7" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "I7" }),
                  /* @__PURE__ */ jsx("strong", { children: "READY TO GO INT-7" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "READY TO GO INT-10" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "I10" }),
                  /* @__PURE__ */ jsx("strong", { children: "READY TO GO INT-10" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "READY TO GO INT-12" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "I12" }),
                  /* @__PURE__ */ jsx("strong", { children: "READY TO GO INT-12" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "collection-choice", children: [
                /* @__PURE__ */ jsx("input", { required: true, type: "radio", name: "collectionType", value: "READY TO GO INT-14" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("i", { children: "I14" }),
                  /* @__PURE__ */ jsx("strong", { children: "READY TO GO INT-14" }),
                  /* @__PURE__ */ jsx("b", {})
                ] })
              ] })
            ] })
          ] }) : selectedPartner === "Vivla" ? /* @__PURE__ */ jsxs("div", { className: "wide form-question vivla-destinations", children: [
            /* @__PURE__ */ jsxs("div", { className: "destination-heading", children: [
              /* @__PURE__ */ jsxs("span", { className: "form-label", children: [
                "Destination regions ",
                /* @__PURE__ */ jsx("small", { children: "Select all that apply" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "spain-pill", children: "\u{1F1EA}\u{1F1F8} SPAIN" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "destination-regions", "aria-label": "Vivla destination regions", children: vivlaRegions.map((region) => /* @__PURE__ */ jsxs("label", { className: "destination-choice", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selectedRegions.includes(region), onChange: () => toggleRegion(region) }),
              /* @__PURE__ */ jsxs("span", { children: [
                region,
                /* @__PURE__ */ jsx("b", { children: selectedRegions.includes(region) ? "\u2713" : "" })
              ] })
            ] }, region)) }),
            /* @__PURE__ */ jsxs("div", { className: "destination-selection-note", children: [
              /* @__PURE__ */ jsx("span", { children: selectedRegions.length ? `${selectedRegions.length} region${selectedRegions.length === 1 ? "" : "s"} selected` : "Choose one or more Spanish regions" }),
              regionError && /* @__PURE__ */ jsx("strong", { role: "alert", children: regionError })
            ] })
          ] }) : null,
          /* @__PURE__ */ jsxs("label", { className: "wide", children: [
            "Property preferences",
            /* @__PURE__ */ jsx("textarea", { name: "propertyPreferences", placeholder: "Sea views, 2\u20133 bedrooms, walkable location\u2026" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "wide", children: [
            "Notes for partner",
            /* @__PURE__ */ jsx("textarea", { name: "partnerNote", placeholder: "Context, next steps and anything important to know\u2026" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { disabled: !selectedPartner, className: !selectedPartner ? "form-section-locked" : "", children: [
        /* @__PURE__ */ jsx("legend", { children: "Notifications to selected partner" }),
        /* @__PURE__ */ jsx("p", { className: "notification-routing-copy", children: "Recipients come from the selected partner\u2019s account. Delivery and activity are recorded in your CRM without duplicate COP email copies." }),
        /* @__PURE__ */ jsxs("div", { className: "notification-options", children: [
          /* @__PURE__ */ jsxs("button", { disabled: !selectedContact?.email, className: email && selectedContact?.email ? "selected" : "", type: "button", onClick: () => setEmail(!email), children: [
            /* @__PURE__ */ jsx("span", { children: "\u2709" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Email notification" }),
              /* @__PURE__ */ jsx("small", { children: selectedContact?.email ? `To ${selectedContact.email}` : selectedPartner ? `Add ${selectedPartner} email first` : "Choose a partner first" })
            ] }),
            /* @__PURE__ */ jsx("i", { children: email && selectedContact?.email ? "\u2713" : "" })
          ] }),
          /* @__PURE__ */ jsxs("button", { disabled: !selectedContact?.phone, className: whatsapp && selectedContact?.phone ? "selected" : "", type: "button", onClick: () => setWhatsapp(!whatsapp), children: [
            /* @__PURE__ */ jsx("span", { children: "\u25C9" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "WhatsApp alert" }),
              /* @__PURE__ */ jsx("small", { children: selectedContact?.phone ? `To ${selectedContact.phone}` : selectedPartner ? `Add ${selectedPartner} WhatsApp number first` : "Choose a partner first" })
            ] }),
            /* @__PURE__ */ jsx("i", { children: whatsapp && selectedContact?.phone ? "\u2713" : "" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `form-consent ${!selectedPartner ? "locked" : ""}`, children: [
        /* @__PURE__ */ jsx("input", { id: "consent", required: true, disabled: !selectedPartner, type: "checkbox" }),
        /* @__PURE__ */ jsx("label", { htmlFor: "consent", children: "I confirm the customer has consented to their details being shared with the selected partner." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", children: "Save draft" }),
        /* @__PURE__ */ jsx("button", { disabled: !selectedPartner || !email && !whatsapp, className: "primary-button", type: "submit", children: selectedPartner ? "Share lead securely \u2192" : "Choose a partner first" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("aside", { className: "form-aside", children: [
      /* @__PURE__ */ jsxs("div", { className: "aside-card dark", children: [
        /* @__PURE__ */ jsx("span", { className: "mini-label", children: "WHAT HAPPENS NEXT" }),
        /* @__PURE__ */ jsxs("ol", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "01" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Partner is notified" }),
              /* @__PURE__ */ jsx("small", { children: "Email or WhatsApp goes directly to the selected partner and is logged in your CRM." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "02" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Lead appears in their portal" }),
              /* @__PURE__ */ jsx("small", { children: selectedPartner ? `Only ${selectedPartner} can access this record in the preview.` : "Choose a partner first to route the lead safely." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "03" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: "You track every update" }),
              /* @__PURE__ */ jsx("small", { children: "Stage changes and notes appear here automatically." })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "aside-card", children: [
        /* @__PURE__ */ jsx("span", { className: "shield-large", children: "\u2713" }),
        /* @__PURE__ */ jsx("h3", { children: "Privacy by design" }),
        /* @__PURE__ */ jsx("p", { children: "The preview demonstrates the intended separation. Production must also enforce the partner ID in authentication and every database query." }),
        /* @__PURE__ */ jsx("a", { href: "#security", children: "View security model \u2192" })
      ] })
    ] })
  ] });
}
function PartnersView({ leadRecords, partnerContacts, onPartnerPreview, onUpdateContact }) {
  const [editingPartner, setEditingPartner] = useState(null);
  const [contactDraft, setContactDraft] = useState(null);
  const partnerCards = [
    { id: "21-5", mark: "21-5", subtitle: "Luxury co-ownership collections", pipeline: "\u20AC1.24m", lastActive: "24m", status: "ACTIVE" },
    { id: "Vivla", mark: "VI", subtitle: "Spanish destination preview workspace", pipeline: "TEST DATA", lastActive: "Preview", status: "MOCK PARTNER" }
  ];
  function editContact(partner) {
    setEditingPartner(partner);
    setContactDraft({ ...partnerContacts[partner] });
  }
  function saveContact(event) {
    event.preventDefault();
    if (!editingPartner || !contactDraft) return;
    onUpdateContact(editingPartner, contactDraft);
    setEditingPartner(null);
    setContactDraft(null);
  }
  return /* @__PURE__ */ jsx("section", { className: "partners-layout", children: /* @__PURE__ */ jsxs("div", { className: "view-card full-view", children: [
    /* @__PURE__ */ jsxs("div", { className: "view-intro", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "mini-label", children: "PARTNER NETWORK" }),
        /* @__PURE__ */ jsx("h2", { children: "Partner previews" }),
        /* @__PURE__ */ jsx("p", { children: "Open each isolated workspace to confirm exactly which leads that partner can see." })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "primary-inline", type: "button", children: "\uFF0B Invite partner" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "partner-preview-list", children: partnerCards.map((partner) => {
      const contact = partnerContacts[partner.id];
      const assignedCount = leadRecords.filter((lead) => lead.partner === partner.id).length;
      return /* @__PURE__ */ jsxs("div", { className: `partner-preview-block ${contact.testRouting ? "mock-partner" : ""}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "partner-detail-card", children: [
          /* @__PURE__ */ jsx(PartnerLogo, { name: partner.id, mark: partner.mark, big: true }),
          /* @__PURE__ */ jsxs("div", { className: "partner-identity", children: [
            /* @__PURE__ */ jsxs("span", { className: "connected-pill", children: [
              /* @__PURE__ */ jsx("i", {}),
              " ",
              partner.status
            ] }),
            /* @__PURE__ */ jsx("h3", { children: partner.id }),
            /* @__PURE__ */ jsx("p", { children: partner.subtitle })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "partner-numbers", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("small", { children: "ASSIGNED LEADS" }),
              /* @__PURE__ */ jsx("strong", { children: assignedCount })
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("small", { children: "PIPELINE" }),
              /* @__PURE__ */ jsx("strong", { children: partner.pipeline })
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("small", { children: "STATUS" }),
              /* @__PURE__ */ jsx("strong", { children: partner.lastActive })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "primary-inline", type: "button", onClick: () => onPartnerPreview(partner.id), children: [
            "Preview ",
            partner.id,
            " portal \u2192"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "partner-contact-strip", children: [
          /* @__PURE__ */ jsxs("span", { className: "contact-avatar", children: [
            contact.firstName.charAt(0),
            contact.lastName.charAt(0)
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("small", { children: contact.testRouting ? "SAFE TEST ROUTING" : "PRIMARY CONTACT" }),
            /* @__PURE__ */ jsxs("strong", { children: [
              contact.firstName,
              " ",
              contact.lastName
            ] })
          ] }),
          /* @__PURE__ */ jsxs("a", { href: `mailto:${contact.email}`, children: [
            /* @__PURE__ */ jsx("span", { children: "\u2709" }),
            contact.email
          ] }),
          /* @__PURE__ */ jsxs("a", { href: `tel:${contact.phone.replace(/\s/g, "")}`, children: [
            /* @__PURE__ */ jsx("span", { children: "\u260F" }),
            contact.phone
          ] }),
          /* @__PURE__ */ jsx("button", { className: "edit-contact-button", type: "button", onClick: () => editContact(partner.id), children: "Edit contact details" })
        ] }),
        editingPartner === partner.id && contactDraft && /* @__PURE__ */ jsxs("form", { className: "partner-contact-editor", onSubmit: saveContact, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "mini-label", children: "NOTIFICATION CONTACT" }),
            /* @__PURE__ */ jsxs("h4", { children: [
              "Edit ",
              partner.id,
              " contact details"
            ] }),
            /* @__PURE__ */ jsx("p", { children: "New leads and admin updates use these recipients." })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "First name",
            /* @__PURE__ */ jsx("input", { required: true, value: contactDraft.firstName, onChange: (event) => setContactDraft({ ...contactDraft, firstName: event.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "Surname",
            /* @__PURE__ */ jsx("input", { required: true, value: contactDraft.lastName, onChange: (event) => setContactDraft({ ...contactDraft, lastName: event.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "Contact email",
            /* @__PURE__ */ jsx("input", { required: true, type: "email", value: contactDraft.email, onChange: (event) => setContactDraft({ ...contactDraft, email: event.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "WhatsApp number ",
            /* @__PURE__ */ jsx("small", { children: "Include country code" }),
            /* @__PURE__ */ jsx("input", { required: true, type: "tel", value: contactDraft.phone, onChange: (event) => setContactDraft({ ...contactDraft, phone: event.target.value }), placeholder: "+34 600 000 000" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "contact-editor-actions", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
              setEditingPartner(null);
              setContactDraft(null);
            }, children: "Cancel" }),
            /* @__PURE__ */ jsx("button", { className: "primary-inline", type: "submit", children: "Save contact details" })
          ] })
        ] })
      ] }, partner.id);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "notification-copy-policy", children: [
      /* @__PURE__ */ jsx("span", { children: "\u25CE" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("small", { children: "CRM NOTIFICATION ROUTING" }),
        /* @__PURE__ */ jsx("strong", { children: "Partner notifications are managed in your CRM" }),
        /* @__PURE__ */ jsx("p", { children: "Emails and WhatsApp alerts go only to the selected partner contact; delivery and activity are tracked centrally." })
      ] }),
      /* @__PURE__ */ jsx("b", { children: "NO DUPLICATE COPY" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "permissions-grid", id: "security", children: [
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { className: "permission-icon", children: "\u2318" }),
        /* @__PURE__ */ jsx("h3", { children: "Isolated workspace" }),
        /* @__PURE__ */ jsx("p", { children: "Each preview is tied to one partner ID and shows only records assigned to that partner." }),
        /* @__PURE__ */ jsx("b", { children: "PRODUCTION MUST ENFORCE THIS SERVER-SIDE" })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { className: "permission-icon", children: "\u25EB" }),
        /* @__PURE__ */ jsx("h3", { children: "Lead-level audit trail" }),
        /* @__PURE__ */ jsx("p", { children: "Production should record sign-ins, stage changes and notes so you can always see who changed what." }),
        /* @__PURE__ */ jsx("b", { children: "REQUIRED FOR LAUNCH" })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { className: "permission-icon", children: "\u2301" }),
        /* @__PURE__ */ jsx("h3", { children: "Minimal notifications" }),
        /* @__PURE__ */ jsx("p", { children: "Email and WhatsApp alerts should contain no personal lead data \u2014 only a secure sign-in link." }),
        /* @__PURE__ */ jsx("b", { children: "PRIVACY FIRST" })
      ] })
    ] })
  ] }) });
}
function InvoicesView({ adminMode, partnerId }) {
  if (!adminMode && partnerId === "Vivla") {
    return /* @__PURE__ */ jsxs("section", { className: "view-card full-view", children: [
      /* @__PURE__ */ jsxs("div", { className: "view-intro", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "mini-label", children: "VIVLA PREVIEW WORKSPACE" }),
          /* @__PURE__ */ jsx("h2", { children: "Invoices" }),
          /* @__PURE__ */ jsx("p", { children: "Only invoices belonging to Vivla would appear here." })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "configured-pill", children: "MOCK DATA" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "empty-leads invoice-empty", children: [
        /* @__PURE__ */ jsx("span", { children: "\u25A4" }),
        /* @__PURE__ */ jsx("strong", { children: "No Vivla invoices in this preview" }),
        /* @__PURE__ */ jsx("p", { children: "The 21-5 commercial records are not visible in this workspace." })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("section", { className: "view-card full-view", children: [
    /* @__PURE__ */ jsxs("div", { className: "view-intro", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "mini-label", children: "COMMERCIAL OVERVIEW" }),
        /* @__PURE__ */ jsx("h2", { children: "Invoices" }),
        /* @__PURE__ */ jsx("p", { children: adminMode ? "Review commission invoices generated from closed-won leads." : "Your completed-lead commission and invoice calculations." })
      ] }),
      adminMode && /* @__PURE__ */ jsx("button", { className: "primary-inline", type: "button", children: "\uFF0B Add invoice" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "invoice-summary", children: [
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("small", { children: "PENDING REVIEW" }),
        /* @__PURE__ */ jsx("strong", { children: "2" }),
        /* @__PURE__ */ jsx("em", { children: "Requires approval" })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("small", { children: "COMMISSION (NET)" }),
        /* @__PURE__ */ jsx("strong", { children: "\u20AC8,840" }),
        /* @__PURE__ */ jsx("em", { children: "Across 2 completed leads" })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("small", { children: "TOTAL (INC. VAT)" }),
        /* @__PURE__ */ jsx("strong", { children: "\u20AC10,696.40" }),
        /* @__PURE__ */ jsx("em", { children: "Current invoice period" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "invoice-list", children: [
      /* @__PURE__ */ jsxs("div", { className: "invoice-row invoice-head", children: [
        /* @__PURE__ */ jsx("span", { children: "LEAD" }),
        /* @__PURE__ */ jsx("span", { children: "SHARE VALUE" }),
        /* @__PURE__ */ jsx("span", { children: "COMMISSION" }),
        /* @__PURE__ */ jsx("span", { children: "INVOICE TOTAL" }),
        /* @__PURE__ */ jsx("span", { children: "STATUS" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "invoice-row", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Amelia Brooks" }),
          /* @__PURE__ */ jsx("small", { children: "Marbella \xB7 Collection" })
        ] }),
        /* @__PURE__ */ jsx("span", { children: "\u20AC278,000" }),
        /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("strong", { children: "3% \xB7 \u20AC8,340" }) }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: "\u20AC10,091.40" }),
          /* @__PURE__ */ jsx("small", { children: "Including VAT" })
        ] }),
        /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("b", { className: "stage contract", children: "Pending" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "invoice-row", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: "William Carter" }),
          /* @__PURE__ */ jsx("small", { children: "C\xF4te d\u2019Azur \xB7 Resale" })
        ] }),
        /* @__PURE__ */ jsx("span", { children: "\u20AC50,000" }),
        /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("strong", { children: "1% \xB7 \u20AC500" }) }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: "\u20AC605.00" }),
          /* @__PURE__ */ jsx("small", { children: "Including VAT" })
        ] }),
        /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("b", { className: "stage new", children: "Draft" }) })
      ] })
    ] })
  ] });
}
function CommissionRatesView() {
  const partnerRates = [
    { id: "21-5", name: "21-5", mark: "21-5", detail: `Primary contact \xB7 ${partnerContact.firstName}`, rates: [{ label: "Collections", value: "3%" }, { label: "Resales", value: "1%" }] },
    { id: "vivla", name: "Vivla", mark: "VI", detail: "Commercial partner", rates: [{ label: "Commission rate", value: "3%" }] },
    { id: "myne", name: "MYNE", mark: "MY", detail: "Commercial partner", rates: [{ label: "Commission rate", value: "2.5%" }] },
    { id: "habitaro", name: "Habitaro", mark: "HA", detail: "Commercial partner", rates: [{ label: "Commission rate", value: "7%" }] },
    { id: "hamlet", name: "Hamlet&", mark: "H&", detail: "Commercial partner", rates: [{ label: "Commission rate", value: "5%" }] }
  ];
  const [agreementFiles, setAgreementFiles] = useState({});
  const [uploadedAgreements, setUploadedAgreements] = useState({});
  return /* @__PURE__ */ jsxs("section", { className: "view-card full-view", children: [
    /* @__PURE__ */ jsxs("div", { className: "view-intro", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "mini-label", children: "PARTNER COMMERCIAL TERMS" }),
        /* @__PURE__ */ jsx("h2", { children: "Commission rates" }),
        /* @__PURE__ */ jsx("p", { children: "Store the agreed rates and signed commercial agreement separately for each partner." })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "configured-pill", children: "5 PARTNERS CONFIGURED" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "commission-partner-list", children: partnerRates.map((partner) => {
      const agreementFile = agreementFiles[partner.id] ?? "";
      const agreementUploaded = uploadedAgreements[partner.id] ?? false;
      return /* @__PURE__ */ jsxs("article", { className: "commission-partner-card", children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsx(PartnerLogo, { name: partner.name, mark: partner.mark }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("span", { className: "connected-pill", children: [
              /* @__PURE__ */ jsx("i", {}),
              " ACTIVE PARTNER"
            ] }),
            /* @__PURE__ */ jsx("h3", { children: partner.name }),
            /* @__PURE__ */ jsx("p", { children: partner.detail })
          ] }),
          /* @__PURE__ */ jsx("b", { children: "AGREED RATE" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `commission-rate-display ${partner.rates.length === 1 ? "single-rate" : ""}`, children: partner.rates.map((rate, index) => /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("small", { children: rate.label.toUpperCase() }),
          /* @__PURE__ */ jsx("strong", { children: rate.value }),
          /* @__PURE__ */ jsx("em", { children: "+ VAT" }),
          index < partner.rates.length - 1 && /* @__PURE__ */ jsx("i", {})
        ] }, rate.label)) }),
        /* @__PURE__ */ jsxs("div", { className: "agreement-upload", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "agreement-file-icon", children: "\u25A4" }),
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Commercial agreement" }),
              /* @__PURE__ */ jsx("small", { children: agreementFile || "Upload the signed agreement for this partner" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("input", { id: `agreement-${partner.id}`, type: "file", accept: ".pdf,.doc,.docx", onChange: (event) => {
            const fileName = event.target.files?.[0]?.name ?? "";
            setAgreementFiles((current) => ({ ...current, [partner.id]: fileName }));
            setUploadedAgreements((current) => ({ ...current, [partner.id]: false }));
          } }),
          /* @__PURE__ */ jsx("label", { htmlFor: `agreement-${partner.id}`, children: agreementFile ? "Replace file" : "Choose file" }),
          /* @__PURE__ */ jsx("button", { type: "button", disabled: !agreementFile || agreementUploaded, onClick: () => setUploadedAgreements((current) => ({ ...current, [partner.id]: true })), children: agreementUploaded ? "Agreement attached \u2713" : "Attach agreement" })
        ] })
      ] }, partner.id);
    }) })
  ] });
}
function LeadDrawer({ lead, role, partnerContacts, onClose, onNotify, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [updateNote, setUpdateNote] = useState("");
  const [selectedStage, setSelectedStage] = useState(lead.stage);
  const isAdmin = role === "admin";
  const isContactIssue = lead.stage === "Unable to contact";
  const reportingContactIssue = selectedStage === "Unable to contact";
  const assignedContact = partnerContacts[lead.partner];
  const partnerLeadType = lead.partner === "Vivla" ? lead.location : lead.collection;
  function sendAdminNote() {
    if (!updateNote.trim()) return;
    setUpdateNote("");
    onNotify(`Note sent to ${lead.partner} \xB7 COP copied`);
  }
  return /* @__PURE__ */ jsx("div", { className: "drawer-backdrop", onMouseDown: onClose, children: /* @__PURE__ */ jsxs("aside", { className: "lead-drawer", onMouseDown: (event) => event.stopPropagation(), children: [
    /* @__PURE__ */ jsx("button", { className: "drawer-close", type: "button", "aria-label": "Close lead details", onClick: onClose, children: "\xD7" }),
    /* @__PURE__ */ jsx("span", { className: `stage ${lead.stage.toLowerCase()}`, children: lead.stage }),
    /* @__PURE__ */ jsxs("div", { className: "drawer-person", children: [
      /* @__PURE__ */ jsx("span", { children: lead.initials }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: lead.name }),
        /* @__PURE__ */ jsx("p", { children: isAdmin ? `${lead.budget} approximate budget` : partnerLeadType })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "pipeline-owner-banner", children: [
      /* @__PURE__ */ jsx("span", { children: isAdmin ? "\u25CE" : "\u2197" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: isAdmin ? "Pipeline managed by the partner" : "You manage this sales pipeline" }),
        /* @__PURE__ */ jsx("small", { children: isAdmin ? `The current stage is visible to you, but only ${lead.partner} can change it.` : "Update the stage whenever this opportunity moves forward." })
      ] })
    ] }),
    isAdmin && isContactIssue && /* @__PURE__ */ jsxs("div", { className: "contact-alert", children: [
      /* @__PURE__ */ jsx("span", { children: "!" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("small", { children: "CONTACT ATTEMPT ALERT" }),
        /* @__PURE__ */ jsxs("strong", { children: [
          lead.partner,
          " could not reach this lead"
        ] }),
        /* @__PURE__ */ jsx("p", { children: "The partner tried by email and phone and has asked COP to help reconnect with the client." }),
        /* @__PURE__ */ jsxs("div", { className: "contact-alert-channels", children: [
          /* @__PURE__ */ jsx("span", { children: "\u2709 info@co-ownership-property.com" }),
          /* @__PURE__ */ jsx("span", { children: "\u25C9 WhatsApp +34 626 786 678" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("b", { children: "EMAIL + WHATSAPP" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "drawer-section", children: [
      /* @__PURE__ */ jsxs("div", { className: "drawer-section-heading", children: [
        /* @__PURE__ */ jsx("small", { children: "LEAD DETAILS" }),
        isAdmin && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditing(!editing), children: editing ? "Cancel" : "Edit lead" })
      ] }),
      editing ? /* @__PURE__ */ jsxs("div", { className: "edit-lead-grid", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "Full name",
          /* @__PURE__ */ jsx("input", { defaultValue: lead.name })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "Email address",
          /* @__PURE__ */ jsx("input", { type: "email", defaultValue: lead.email })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "Phone number",
          /* @__PURE__ */ jsx("input", { type: "tel", defaultValue: lead.phone })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "Lead nationality ",
          /* @__PURE__ */ jsx("small", { children: "Optional" }),
          /* @__PURE__ */ jsxs("select", { defaultValue: lead.nationality, children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Not specified" }),
            countries.map((country) => /* @__PURE__ */ jsx("option", { value: country, children: country }, country))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "Budget range",
          /* @__PURE__ */ jsx("input", { defaultValue: lead.budget })
        ] }),
        lead.partner === "Vivla" ? /* @__PURE__ */ jsxs("label", { className: "wide", children: [
          "Destination regions",
          /* @__PURE__ */ jsx("select", { defaultValue: lead.location.split(", ")[0], children: vivlaRegions.map((region) => /* @__PURE__ */ jsx("option", { children: region }, region)) })
        ] }) : /* @__PURE__ */ jsxs("label", { className: "wide", children: [
          "Collection type",
          /* @__PURE__ */ jsxs("select", { defaultValue: lead.collection, children: [
            /* @__PURE__ */ jsx("option", { children: "City Retreats" }),
            /* @__PURE__ */ jsx("option", { children: "Large" }),
            /* @__PURE__ */ jsx("option", { children: "Large Nordic" }),
            /* @__PURE__ */ jsx("option", { children: "Grande" }),
            /* @__PURE__ */ jsx("option", { children: "Beyond" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-7" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-10" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-12" }),
            /* @__PURE__ */ jsx("option", { children: "READY TO GO INT-14" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "save-details", type: "button", onClick: () => {
          setEditing(false);
          onNotify("Lead details updated");
        }, children: "Save changes" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "lead-detail-list", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { children: "\u2709" }),
          lead.email
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { children: "\u260F" }),
          /* @__PURE__ */ jsx(PhoneDisplay, { phone: lead.phone })
        ] }),
        lead.nationality && /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { children: "\u25CE" }),
          lead.nationality,
          " nationality"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { children: "\u25EB" }),
          partnerLeadType
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "drawer-section", children: [
      /* @__PURE__ */ jsx("small", { children: "ASSIGNED PARTNER" }),
      /* @__PURE__ */ jsxs("div", { className: "drawer-partner", children: [
        /* @__PURE__ */ jsx("span", { children: lead.partner }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: lead.partner }),
          /* @__PURE__ */ jsx("p", { children: isAdmin ? `${assignedContact.testRouting ? "COP test routing" : "Primary contact"} \xB7 ${assignedContact.firstName} ${assignedContact.lastName} \xB7 ${assignedContact.email} \xB7 ${assignedContact.phone}` : "Lead shared by Co-Ownership Property" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "drawer-section", children: [
      /* @__PURE__ */ jsx("small", { children: "ORIGINAL LEAD CONTEXT" }),
      /* @__PURE__ */ jsx("p", { className: "note-box", children: lead.note })
    ] }),
    isAdmin ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "drawer-section admin-note-section", children: [
        /* @__PURE__ */ jsx("small", { children: "SEND AN UPDATE TO THE PARTNER" }),
        /* @__PURE__ */ jsx("textarea", { value: updateNote, onChange: (event) => setUpdateNote(event.target.value), placeholder: "For example: The client contacted us again and is now considering a different collection. It may be a good idea to follow up." }),
        /* @__PURE__ */ jsxs("div", { className: "notification-recipient", children: [
          /* @__PURE__ */ jsx("span", { children: "\u2709" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("strong", { children: [
              "Sent automatically to ",
              assignedContact.firstName,
              " ",
              assignedContact.lastName
            ] }),
            /* @__PURE__ */ jsxs("small", { children: [
              assignedContact.email,
              " \xB7 activity logged in CRM"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "drawer-action", disabled: !updateNote.trim(), type: "button", onClick: sendAdminNote, children: "Send note to partner \u2192" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "drawer-section", children: [
        /* @__PURE__ */ jsx("small", { children: "ACTIVITY" }),
        /* @__PURE__ */ jsxs("div", { className: "drawer-timeline", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("i", { children: "DO" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsxs("strong", { children: [
                "Lead shared with ",
                lead.partner
              ] }),
              /* @__PURE__ */ jsxs("small", { children: [
                "David \xB7 ",
                lead.age
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("i", { className: "partner-event", children: lead.partner }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: isContactIssue ? "Unable to make contact by email or phone" : `Stage updated to ${lead.stage}` }),
              /* @__PURE__ */ jsx("small", { children: "Partner office \xB7 Yesterday" })
            ] })
          ] }),
          isContactIssue && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("i", { className: "alert-event", children: "!" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: "COP admin notified" }),
              /* @__PURE__ */ jsx("small", { children: "Email + WhatsApp alert \xB7 Yesterday" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "drawer-section delete-lead-section", children: [
        /* @__PURE__ */ jsx("small", { children: "ADMIN CONTROLS" }),
        deleteConfirm ? /* @__PURE__ */ jsxs("div", { className: "delete-confirmation", children: [
          /* @__PURE__ */ jsx("span", { children: "!" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("strong", { children: [
              "Delete ",
              lead.name,
              "?"
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "This removes the lead from Admin and from the ",
              lead.partner,
              " partner view."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDeleteConfirm(false), children: "Cancel" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onDelete(lead), children: "Yes, delete lead" })
          ] })
        ] }) : /* @__PURE__ */ jsx("button", { className: "delete-lead-button", type: "button", onClick: () => setDeleteConfirm(true), children: "Delete this lead" })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "drawer-section cop-update", children: [
        /* @__PURE__ */ jsx("small", { children: "UPDATE FROM CO-OWNERSHIP PROPERTY" }),
        /* @__PURE__ */ jsxs("div", { className: "cop-update-note", children: [
          /* @__PURE__ */ jsx("span", { children: "DO" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "David \xB7 12 minutes ago" }),
            /* @__PURE__ */ jsx("p", { children: "The client contacted us again and may also consider another collection. It would be a good idea to follow up." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "partner-pipeline-form", children: [
        /* @__PURE__ */ jsxs("label", { className: "drawer-stage", children: [
          "Update pipeline stage",
          /* @__PURE__ */ jsxs("select", { value: selectedStage, onChange: (event) => setSelectedStage(event.target.value), children: [
            /* @__PURE__ */ jsx("option", { children: "New" }),
            /* @__PURE__ */ jsx("option", { children: "Consultation" }),
            /* @__PURE__ */ jsx("option", { children: "Viewing" }),
            /* @__PURE__ */ jsx("option", { children: "Contract" }),
            /* @__PURE__ */ jsx("option", { children: "Won" }),
            /* @__PURE__ */ jsx("option", { children: "Unable to contact" }),
            /* @__PURE__ */ jsx("option", { children: "Closed Lost" })
          ] })
        ] }),
        reportingContactIssue && /* @__PURE__ */ jsxs("div", { className: "contact-help-copy", children: [
          /* @__PURE__ */ jsx("span", { children: "!" }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("strong", { children: "COP will be notified automatically by email and WhatsApp." }),
            /* @__PURE__ */ jsx("small", { children: "info@co-ownership-property.com \xB7 +34 626 786 678" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          reportingContactIssue ? "Contact attempt note" : "Add a progress note",
          /* @__PURE__ */ jsx("textarea", { required: reportingContactIssue, value: updateNote, onChange: (event) => setUpdateNote(event.target.value), placeholder: reportingContactIssue ? "For example: Two calls and one email sent over the last five days, with no response\u2026" : "Add context for the stage change or next step\u2026" })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "drawer-action", disabled: reportingContactIssue && !updateNote.trim(), type: "button", onClick: () => {
          onClose();
          onNotify(reportingContactIssue ? "COP admin notified by email and WhatsApp" : "Partner pipeline update saved");
        }, children: reportingContactIssue ? "Save & notify COP admin" : "Save pipeline update" })
      ] })
    ] })
  ] }) });
}
function Home() {
  const [view, setView] = useState("overview");
  const [role, setRole] = useState("admin");
  const [leadRecords, setLeadRecords] = useState(leads);
  const [partnerContacts, setPartnerContacts] = useState(partnerDirectory);
  const [activePartner, setActivePartner] = useState("21-5");
  const [selectedLead, setSelectedLead] = useState(null);
  const [toast, setToast] = useState("");
  function switchRole(nextRole, partner = activePartner) {
    setSelectedLead(null);
    setRole(nextRole);
    setActivePartner(partner);
    setView(nextRole === "partner" ? "leads" : "overview");
    setToast(nextRole === "partner" ? `Partner preview: ${partner}` : "Admin view restored");
  }
  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3e3);
  }
  function navigate(nextView) {
    if (role === "partner" && (nextView === "submit" || nextView === "partners" || nextView === "rates")) return;
    setView(nextView);
  }
  function updatePartnerContact(partner, contact) {
    setPartnerContacts((current) => ({ ...current, [partner]: contact }));
    notify(`${partner} contact details saved`);
  }
  function deleteLead(lead) {
    setLeadRecords((current) => current.filter((candidate) => !(candidate.partner === lead.partner && candidate.email === lead.email)));
    setSelectedLead(null);
    notify(`${lead.name} deleted from Admin and ${lead.partner}`);
  }
  const activePartnerContact = partnerContacts[activePartner];
  const partnerLeadCount = leadRecords.filter((lead) => lead.partner === activePartner).length;
  const nav = role === "admin" ? [{ id: "overview", label: "Overview", icon: "\u2302" }, { id: "leads", label: "Leads", icon: "\u25EB", count: String(leadRecords.length) }, { id: "submit", label: "Submit lead", icon: "\uFF0B" }, { id: "partners", label: "Partners", icon: "\u25CE" }, { id: "rates", label: "Commission rates", icon: "%" }, { id: "invoices", label: "Invoices", icon: "\u25A4", count: "2" }] : [{ id: "leads", label: "My leads", icon: "\u25EB", count: String(partnerLeadCount) }, { id: "invoices", label: "Invoices", icon: "\u25A4", count: activePartner === "21-5" ? "2" : "0" }];
  const titles = { overview: { eyebrow: "THURSDAY, 14 AUGUST", title: "Good morning, Dylan" }, leads: { eyebrow: role === "admin" ? "LEAD MANAGEMENT" : `${activePartner.toUpperCase()} \xB7 PRIVATE PARTNER WORKSPACE`, title: role === "admin" ? "Your pipeline" : "Your assigned leads" }, submit: { eyebrow: "SECURE INTRODUCTION", title: "New lead" }, partners: { eyebrow: "PARTNER NETWORK", title: "Partner access" }, rates: { eyebrow: "COMMERCIAL TERMS", title: "Partner rates" }, invoices: { eyebrow: role === "admin" ? "COMMERCIAL OVERVIEW" : activePartner.toUpperCase(), title: "Invoices & commission" } };
  return /* @__PURE__ */ jsxs("main", { className: "portal-shell", children: [
    /* @__PURE__ */ jsxs("aside", { className: "sidebar", children: [
      /* @__PURE__ */ jsx(Brand, {}),
      /* @__PURE__ */ jsx("nav", { className: "main-nav", "aria-label": "Portal navigation", children: nav.map((item) => /* @__PURE__ */ jsxs("button", { className: view === item.id ? "active" : "", type: "button", onClick: () => navigate(item.id), children: [
        /* @__PURE__ */ jsx("span", { children: item.icon }),
        item.label,
        item.count && /* @__PURE__ */ jsx("b", { children: item.count })
      ] }, item.id)) }),
      /* @__PURE__ */ jsx("div", { className: "sidebar-spacer" }),
      /* @__PURE__ */ jsxs("div", { className: "role-switch", children: [
        /* @__PURE__ */ jsx("small", { children: "DEMO VIEW" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("button", { className: role === "admin" ? "active" : "", type: "button", onClick: () => switchRole("admin"), children: "Admin" }),
          /* @__PURE__ */ jsx("button", { className: role === "partner" ? "active" : "", type: "button", onClick: () => switchRole("partner"), children: "Partner" })
        ] }),
        role === "partner" && /* @__PURE__ */ jsxs("label", { className: "preview-partner-select", children: [
          "Preview partner",
          /* @__PURE__ */ jsxs("select", { value: activePartner, onChange: (event) => switchRole("partner", event.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "21-5", children: "21-5" }),
            /* @__PURE__ */ jsx("option", { value: "Vivla", children: "Vivla mock" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "security-note", children: [
        /* @__PURE__ */ jsx("span", { children: "\u2713" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: role === "admin" ? "Private preview" : "Scoped preview" }),
          /* @__PURE__ */ jsx("small", { children: role === "admin" ? "Check each partner view before launch" : `${activePartner} leads only` })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "profile-card", type: "button", onClick: () => notify("Use COP Admin sign out above"), children: [
        /* @__PURE__ */ jsx("span", { className: "avatar", children: role === "admin" ? "DO" : `${activePartnerContact.firstName.charAt(0)}${activePartnerContact.lastName.charAt(0)}` }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: role === "admin" ? "David Olsson" : `${activePartnerContact.firstName} ${activePartnerContact.lastName}` }),
          /* @__PURE__ */ jsx("small", { children: role === "admin" ? "Administrator" : `${activePartner} ${activePartnerContact.testRouting ? "mock preview" : "partner contact"}` })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "logout-label", children: "Sign out" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "workspace", children: [
      /* @__PURE__ */ jsxs("header", { className: "topbar", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "eyebrow", children: titles[view].eyebrow }),
          /* @__PURE__ */ jsx("h1", { children: titles[view].title })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "top-actions", children: [
          /* @__PURE__ */ jsx("span", { className: `access-chip ${role}`, children: role === "admin" ? "ADMIN VIEW" : `${activePartner.toUpperCase()} PREVIEW` }),
          /* @__PURE__ */ jsxs("button", { className: "icon-button", type: "button", "aria-label": "Notifications", children: [
            "\u2662",
            /* @__PURE__ */ jsx("span", {})
          ] }),
          role === "admin" && /* @__PURE__ */ jsx("button", { className: "secondary-button", type: "button", onClick: () => notify("Partner invitation mockup opened"), children: "\uFF0B Add partner" }),
          /* @__PURE__ */ jsx("button", { className: "primary-button", type: "button", onClick: () => role === "admin" ? navigate("submit") : notify("Partner note saved"), children: role === "admin" ? "\uFF0B New lead" : "\uFF0B Add update" })
        ] })
      ] }),
      view === "overview" && /* @__PURE__ */ jsx(OverviewView, { leadRecords, onNavigate: navigate, onLead: setSelectedLead }),
      view === "leads" && /* @__PURE__ */ jsx(LeadsView, { partnerMode: role === "partner", partnerId: activePartner, leadRecords, onLead: setSelectedLead }),
      view === "submit" && /* @__PURE__ */ jsx(SubmitView, { partnerContacts, onDone: (partner, lead) => {
        setLeadRecords((current) => [lead, ...current]);
        notify(`Lead added to ${partner} \xB7 notification logged in CRM`);
        setView("leads");
      } }),
      view === "partners" && /* @__PURE__ */ jsx(PartnersView, { leadRecords, partnerContacts, onUpdateContact: updatePartnerContact, onPartnerPreview: (partner) => switchRole("partner", partner) }),
      view === "rates" && /* @__PURE__ */ jsx(CommissionRatesView, {}),
      view === "invoices" && /* @__PURE__ */ jsx(InvoicesView, { adminMode: role === "admin", partnerId: activePartner })
    ] }),
    selectedLead && /* @__PURE__ */ jsx(LeadDrawer, { lead: selectedLead, role, partnerContacts, onClose: () => setSelectedLead(null), onNotify: notify, onDelete: deleteLead }, `${role}-${selectedLead.name}`),
    toast && /* @__PURE__ */ jsxs("div", { className: "toast", children: [
      /* @__PURE__ */ jsx("span", { children: "\u2713" }),
      toast
    ] })
  ] });
}
function AdminPartnersPage() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "COP Partner Hub" }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex,nofollow" })
    ] }),
    /* @__PURE__ */ jsx(AdminLayout, { fullBleed: true, children: /* @__PURE__ */ jsx("div", { className: "partner-hub-root", children: /* @__PURE__ */ jsx(Home, {}) }) })
  ] });
}
export {
  AdminPartnersPage as default
};
