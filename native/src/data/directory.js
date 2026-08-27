// Shared lookup for every non-"you" person referenced across social and
// chat screens (feed authors, follow lists, threads, search). Uses the same
// pravatar.cc seeds as the seed posts in state/store.jsx, so a given handle
// always renders the same face everywhere it shows up.
// `followers`/`following` are per-person figures that live here rather than
// being hardcoded into the profile screen — UserProfileScreen used to print
// the literals 1284 and 312 for *every* account, so two different profiles
// showed identical stats. Each handle also carries who they follow, so the
// follow list for another account shows real people from this directory
// instead of reusing your own following list.
export const DIRECTORY = {
  "mara.eth": { handle: "mara.eth", name: "Mara Osei", initials: "MO", bio: "Position sizing over prediction. Ex-market maker.", avatarUrl: "https://i.pravatar.cc/150?u=mara", followers: 12840, following: ["0xquiet", "leo.base", "toby"] },
  "0xquiet": { handle: "0xquiet", name: "Ines Duarte", initials: "ID", bio: "Funding rates and quiet charts.", avatarUrl: "https://i.pravatar.cc/150?u=ines", followers: 4207, following: ["mara.eth", "leo.base"] },
  "leo.base": { handle: "leo.base", name: "Leo Marchetti", initials: "LM", bio: "Self-custody maximalist. Test your backups.", avatarUrl: "https://i.pravatar.cc/150?u=leo", followers: 31502, following: ["mara.eth"] },
  toby: { handle: "toby", name: "Toby Vance", initials: "TV", bio: "Learning in public.", avatarUrl: "https://i.pravatar.cc/150?u=toby", followers: 318, following: ["mara.eth", "0xquiet", "leo.base", "dogefather"] },
  dogefather: { handle: "dogefather", name: "Doge Father", initials: "DF", bio: "Not financial advice, just vibes.", avatarUrl: "https://i.pravatar.cc/150?u=doge", followers: 88401, following: ["toby"] },
  "sana.sol": { handle: "sana.sol", name: "Sana Iqbal", initials: "SI", bio: "Solana dev. Latency is a feature.", avatarUrl: "https://i.pravatar.cc/150?u=sana", followers: 15772, following: ["mara.eth", "leo.base"], verified: true },
  "nk.defi": { handle: "nk.defi", name: "Nikhil Rao", initials: "NR", bio: "Yield farmer. Liquidated twice, wiser once.", avatarUrl: "https://i.pravatar.cc/150?u=nikhil", followers: 9340, following: ["0xquiet", "toby"] },
  "ava.charts": { handle: "ava.charts", name: "Ava Lindqvist", initials: "AL", bio: "TA without the mysticism. Levels or silence.", avatarUrl: "https://i.pravatar.cc/150?u=ava", followers: 27615, following: ["mara.eth", "0xquiet"], verified: true },
  "kenji.btc": { handle: "kenji.btc", name: "Kenji Watanabe", initials: "KW", bio: "Stacking since 2013. Ignore the noise.", avatarUrl: "https://i.pravatar.cc/150?u=kenji", followers: 44190, following: ["leo.base"] },
  "priya.eth": { handle: "priya.eth", name: "Priya Menon", initials: "PM", bio: "Smart contract auditor. Read the code.", avatarUrl: "https://i.pravatar.cc/150?u=priya", followers: 33028, following: ["sana.sol", "mara.eth"], verified: true },
  zaid: { handle: "zaid", name: "Zaid Haddad", initials: "ZH", bio: "Macro guy who wandered into crypto.", avatarUrl: "https://i.pravatar.cc/150?u=zaid", followers: 6120, following: ["ava.charts"] },
};

export const DIRECTORY_LIST = Object.values(DIRECTORY);
