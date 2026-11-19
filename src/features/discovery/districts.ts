export const districts = [
  {
    id: "apex",
    name: "Apex District",
    tag: "FULL THROTTLE",
    genre: "Racing · Sports · Action",
    description:
      "Find your line. Chase the horizon. A district built for split-second decisions and the beautiful pursuit of speed.",
    symbol: "↗",
    titles: ["Precision racing", "Open-road exploration", "Time attack"],
  },
  {
    id: "wilds",
    name: "The Wilds",
    tag: "BEYOND THE KNOWN",
    genre: "Adventure · RPG · Exploration",
    description:
      "Past the pines, beyond the citadel. Get wonderfully lost in worlds with stories to tell and secrets worth finding.",
    symbol: "✳",
    titles: [
      "Expansive adventures",
      "Character-driven RPGs",
      "Survival worlds",
    ],
  },
  {
    id: "command",
    name: "Command Sector",
    tag: "THINK AHEAD",
    genre: "Strategy · Simulation · Tactics",
    description:
      "Every move makes a world. Build something extraordinary, outthink your opponent, and turn a small decision into a grand design.",
    symbol: "◈",
    titles: [
      "City-building simulations",
      "Turn-based tactics",
      "Competitive strategy",
    ],
  },
] as const;
export type DistrictId = (typeof districts)[number]["id"];
