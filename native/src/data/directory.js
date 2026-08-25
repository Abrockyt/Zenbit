// Shared lookup for every non-"you" person referenced across social and
// chat screens (feed authors, follow lists, threads, search). Uses the same
// pravatar.cc seeds as the seed posts in state/store.jsx, so a given handle
// always renders the same face everywhere it shows up.
export const DIRECTORY = {
  "mara.eth": { handle: "mara.eth", name: "Mara Osei", initials: "MO", bio: "Position sizing over prediction. Ex-market maker.", avatarUrl: "https://i.pravatar.cc/150?u=mara" },
  "0xquiet": { handle: "0xquiet", name: "Ines Duarte", initials: "ID", bio: "Funding rates and quiet charts.", avatarUrl: "https://i.pravatar.cc/150?u=ines" },
  "leo.base": { handle: "leo.base", name: "Leo Marchetti", initials: "LM", bio: "Self-custody maximalist. Test your backups.", avatarUrl: "https://i.pravatar.cc/150?u=leo" },
  toby: { handle: "toby", name: "Toby Vance", initials: "TV", bio: "Learning in public.", avatarUrl: "https://i.pravatar.cc/150?u=toby" },
  dogefather: { handle: "dogefather", name: "Doge Father", initials: "DF", bio: "Not financial advice, just vibes.", avatarUrl: "https://i.pravatar.cc/150?u=doge" },
};

export const DIRECTORY_LIST = Object.values(DIRECTORY);
