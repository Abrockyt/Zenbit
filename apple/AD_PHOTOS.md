# Ad photos (optional – ads already have animated art without them)

Every ad uses `AdMedia`: if the asset catalog (`Shared/Ads.xcassets`) contains an image set named
`ad-<offer>`, the photo is used full-bleed with a slow zoom; otherwise the animated scene is drawn.

| Asset name | Prompt (realistic, editorial ad photography, 4:3, no text, no logos, soft natural light) |
|---|---|
| `ad-flights` | Aeroplane wing seen from a window seat at golden hour above soft clouds, warm sky gradient |
| `ad-food` | Overhead shot of a colourful Indian thali / takeaway meal on a warm orange surface, steam rising |
| `ad-earbuds` | Pair of white wireless earbuds with charging case on a dark reflective surface, rim light |
| `ad-gold` | Close-up of stacked gold coins and a small gold bar, shallow depth of field, warm light |
| `ad-insurance` | Hand holding a smartphone with a protective glass reflection, calm indigo background |

Add each as `Shared/Ads.xcassets/ad-<offer>.imageset/` (1× 1600 px wide JPG is plenty), then rebuild.
Partners and offers are fictional. Photos must be licensed for commercial use.
