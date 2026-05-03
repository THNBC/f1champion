export type Team = {
  id: string;
  name: string;
  country: string;
  logo: string;
  color: string;
  carImage?: string;
};

export type Driver = {
  id: string;
  name: string;
  nationality: string;
  teamId: string;
};

export type Circuit = {
  id: string;
  name: string;
  grandPrix: string;
  country: string;
  location: string;
  date: string;
  laps: number;
  length: string;
  flag: string;
  trackImage?: string;
  trackMap?: string;
  countryColor?: string;
};

export type RaceResultStatus = "NORMAL" | "DNF";

export type RaceResult = {
  id: string;
  raceId: string;
  position: number;
  driverId: string;
  teamId: string;
  grid: number;
  stops: number;
  fastestLap?: string;
  penalty: boolean;
  timeOrGap: string;
  points: number;
  status: RaceResultStatus;
};

export type RaceAwards = {
  raceId: string;
  driverOfTheDay?: string;
  mostOvertakes?: string;
  cleanestDriving?: string;
};