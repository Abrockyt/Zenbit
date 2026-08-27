import { DIRECTORY } from "./directory";

// Feed seed, split out of state/store.jsx now that it's substantial enough
// to be its own dataset. Every post carries the full shape the redesigned
// feed renders: trade calls, tags, images, community, reposts/quotes,
// bookmarks, pins and view counts.
//
// All imagery is real (Unsplash for photos, pravatar for faces) — no grey
// placeholder rectangles, per the project's no-placeholder-content rule.

const m = 60 * 1000;
const h = 60 * m;
const now = Date.now();

function author(handle) {
  const p = DIRECTORY[handle];
  return { handle, name: p.name, initials: p.initials, avatarUrl: p.avatarUrl, verified: !!p.verified };
}

function reply(handle, body, ago, likes = 0) {
  return { id: `r${Math.random().toString(36).slice(2, 9)}`, author: author(handle), body, createdAt: now - ago, likes };
}

export const seedPosts = [
  {
    id: "p1",
    author: author("mara.eth"),
    body: "Rotated a third of my $SOL into $USDC ahead of the unlock. Not advice — just don't want to be forced to sell later.",
    tags: ["trades", "solana"],
    trade: { coin: "SOL", direction: "Short", price: "142.50" },
    community: "c-ta",
    type: "post",
    createdAt: now - 42 * m,
    likes: 34, liked: false, reposts: 8, reposted: false, bookmarked: false, views: 4210, pinned: false,
    replies: [
      reply("toby", "Same. Sizing down beats timing it.", 30 * m, 4),
      reply("nk.defi", "Unlock cliffs are the one calendar event I actually respect.", 22 * m, 2),
    ],
  },
  {
    id: "p2",
    author: author("0xquiet"),
    body: "The only chart that matters this week is the $BTC funding rate. Everything else is downstream of leverage getting flushed.",
    tags: ["analysis", "bitcoin"],
    image: "https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=900&q=80",
    community: "c-ta",
    type: "post",
    createdAt: now - 5 * h,
    likes: 128, liked: true, reposts: 41, reposted: false, bookmarked: true, views: 18700, pinned: false,
    replies: [reply("ava.charts", "Funding flipped negative twice this week already.", 4 * h, 11)],
  },
  {
    id: "p3",
    author: author("leo.base"),
    body: "Reminder that a hardware wallet you never test is a hardware wallet you don't have. Do a small recovery drill this weekend — send yourself $10, wipe the device, restore from seed.",
    tags: ["security", "selfcustody"],
    image: "https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=900&q=80",
    community: "c-sec",
    type: "post",
    createdAt: now - 22 * h,
    likes: 291, liked: false, reposts: 96, reposted: false, bookmarked: false, views: 52400, pinned: true,
    replies: [
      reply("priya.eth", "Recovery drills catch more problems than any audit I've run.", 20 * h, 22),
      reply("kenji.btc", "Did mine last month. Found a transcription typo on word 9.", 18 * h, 31),
    ],
  },
  {
    id: "p4",
    author: author("toby"),
    body: "Anyone else seeing this weird volume spike on ETH pairs across Asian hours? Looks like accumulation to me.",
    tags: ["alpha", "analysis", "ethereum"],
    trade: { coin: "ETH", direction: "Long", price: "2450.00" },
    community: "c-eth",
    type: "post",
    createdAt: now - 2 * h,
    likes: 85, liked: false, reposts: 12, reposted: false, bookmarked: false, views: 9120, pinned: false,
    replies: [reply("zaid", "Tracks with the CME gap conversation from Monday.", 90 * m, 6)],
  },
  {
    id: "p5",
    author: author("ava.charts"),
    body: "BTC weekly close above 76k and the whole Q1 range flips into support. Below 71k and I'm out of the swing entirely. Those are the only two levels I care about.",
    tags: ["analysis", "bitcoin"],
    trade: { coin: "BTC", direction: "Long", price: "74200.00" },
    image: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=900&q=80",
    community: "c-ta",
    type: "post",
    createdAt: now - 3 * h,
    likes: 412, liked: false, reposts: 134, reposted: false, bookmarked: true, views: 61300, pinned: false,
    replies: [
      reply("mara.eth", "Clean invalidation. Wish more people posted these.", 2 * h, 38),
      reply("toby", "Saving this one.", 100 * m, 3),
    ],
  },
  {
    id: "p6",
    author: author("priya.eth"),
    body: "Audited a 'yield optimizer' this week that stored the admin key in an unprotected storage slot. If a protocol won't show you the code, the yield is the bait.",
    tags: ["security", "defi"],
    community: "c-defi",
    type: "post",
    createdAt: now - 7 * h,
    likes: 668, liked: false, reposts: 240, reposted: false, bookmarked: false, views: 88900, pinned: false,
    replies: [reply("nk.defi", "This is why I cap exposure per protocol at 5%.", 6 * h, 44)],
  },
  {
    id: "p7",
    author: author("sana.sol"),
    body: "Shipped a change that cut our RPC p99 from 840ms to 190ms. Turns out we were re-deriving the same PDA on every request. Profile before you optimise.",
    tags: ["solana", "building"],
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=900&q=80",
    community: "c-sol",
    type: "post",
    createdAt: now - 9 * h,
    likes: 203, liked: false, reposts: 37, reposted: false, bookmarked: false, views: 21400, pinned: false,
    replies: [],
  },
  {
    id: "p8",
    author: author("kenji.btc"),
    body: "Eleven years in and the lesson hasn't changed: the people who did best were the ones who checked prices least.",
    tags: ["bitcoin"],
    community: "c-btc",
    type: "post",
    createdAt: now - 14 * h,
    likes: 1204, liked: false, reposts: 388, reposted: false, bookmarked: false, views: 143000, pinned: false,
    replies: [reply("leo.base", "Boring compounds.", 12 * h, 67)],
  },
  {
    id: "p9",
    author: author("nk.defi"),
    // Quote-post: carries its own commentary plus the post it's quoting.
    body: "This is the correct framing. Yield is a payment for risk you haven't identified yet.",
    tags: ["defi"],
    quoteOf: "p6",
    type: "post",
    createdAt: now - 5 * h,
    likes: 97, liked: false, reposts: 14, reposted: false, bookmarked: false, views: 8800, pinned: false,
    replies: [],
  },
  {
    id: "p10",
    author: author("dogefather"),
    body: "When you buy the dip but it keeps dipping 😭",
    tags: ["memes"],
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=900&q=80",
    type: "post",
    createdAt: now - 24 * h,
    likes: 420, liked: false, reposts: 155, reposted: false, bookmarked: false, views: 71200, pinned: false,
    replies: [],
  },
  {
    id: "p11",
    author: author("zaid"),
    body: "Rate cut odds moved 18% this morning and crypto didn't blink. Either the correlation is finally breaking or nobody's read the print yet.",
    tags: ["macro", "analysis"],
    type: "post",
    createdAt: now - 80 * m,
    likes: 156, liked: false, reposts: 29, reposted: false, bookmarked: false, views: 12800, pinned: false,
    replies: [reply("0xquiet", "It's the second one. Give it an hour.", 60 * m, 19)],
  },
  {
    id: "p12",
    author: author("mara.eth"),
    body: "Position sizing thread, since three people asked this week:\n\n1. Decide the loss you'll accept before the entry\n2. Work backwards to the size\n3. Never adjust step 1 after you're in",
    tags: ["trades", "education"],
    community: "c-ta",
    type: "post",
    createdAt: now - 30 * h,
    likes: 892, liked: false, reposts: 310, reposted: false, bookmarked: true, views: 104000, pinned: true,
    replies: [reply("toby", "Step 3 is the hard one.", 28 * h, 52)],
  },
];

export { seedPosts as default };
