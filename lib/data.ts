import { Team, Driver, Circuit } from "@/types/f1";

// 🏎️ EQUIPES
export const teams: Team[] = [
  {
    id: "redbull",
    name: "Red Bull Racing",
    country: "Austria",
    logo: "/logos/redbull.png",
    color: "#0845b4",
  },
  {
    id: "ferrari",
    name: "Ferrari",
    country: "Italy",
    logo: "/logos/ferrari.png",
    color: "#dc0000",
  },
  {
    id: "mercedes",
    name: "Mercedes",
    country: "Germany",
    logo: "/logos/mercedes.png",
    color: "#00d2be",
  },
  {
    id: "mclaren",
    name: "McLaren",
    country: "UK",
    logo: "/logos/mclaren.png",
    color: "#ff8700",
  },
  {
    id: "astonmartin",
    name: "Aston Martin",
    country: "UK",
    logo: "/logos/astonmartin.png",
    color: "#006f62",
  },
];

// 👤 PILOTOS
export const drivers: Driver[] = [
  {
    id: "verstappen",
    name: "Max Verstappen",
    nationality: "Netherlands",
    teamId: "redbull",
  },
  {
    id: "perez",
    name: "Sergio Perez",
    nationality: "Mexico",
    teamId: "redbull",
  },
  {
    id: "leclerc",
    name: "Charles Leclerc",
    nationality: "Monaco",
    teamId: "ferrari",
  },
  {
    id: "sainz",
    name: "Carlos Sainz",
    nationality: "Spain",
    teamId: "ferrari",
  },
  {
    id: "hamilton",
    name: "Lewis Hamilton",
    nationality: "UK",
    teamId: "mercedes",
  },
  {
    id: "russell",
    name: "George Russell",
    nationality: "UK",
    teamId: "mercedes",
  },
  {
    id: "norris",
    name: "Lando Norris",
    nationality: "UK",
    teamId: "mclaren",
  },
  {
    id: "piastri",
    name: "Oscar Piastri",
    nationality: "Australia",
    teamId: "mclaren",
  },
  {
    id: "alonso",
    name: "Fernando Alonso",
    nationality: "Spain",
    teamId: "astonmartin",
  },
  {
    id: "stroll",
    name: "Lance Stroll",
    nationality: "Canada",
    teamId: "astonmartin",
  },
];

// 🏁 CIRCUITOS
export const circuits: Circuit[] = [
  {
    id: "bahrain",
    name: "Bahrain International Circuit",
    grandPrix: "GP do Bahrein",
    country: "Bahrain",
    location: "Sakhir",
    date: "02/03/2024",
    laps: 57,
    length: "5.412 km",
    flag: "https://flagcdn.com/w40/bh.png",
    trackImage: "/races/bahrain.png",
    countryColor: "#a30000",
  },
  {
    id: "jeddah",
    name: "Jeddah Corniche Circuit",
    grandPrix: "GP da Arábia Saudita",
    country: "Saudi Arabia",
    location: "Jeddah",
    date: "09/03/2024",
    laps: 50,
    length: "6.174 km",
    flag: "https://flagcdn.com/w40/sa.png",
    trackImage: "/races/jeddah.png",
    countryColor: "#006c35",
  },
  {
    id: "australia",
    name: "Albert Park Circuit",
    grandPrix: "GP da Austrália",
    country: "Australia",
    location: "Melbourne",
    date: "24/03/2024",
    laps: 58,
    length: "5.278 km",
    flag: "https://flagcdn.com/w40/au.png",
    trackImage: "/races/australia.png",
    countryColor: "#012169",
  },
];