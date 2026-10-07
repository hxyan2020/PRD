/** Resolve a Lucide-like icon key for a Wikidata genre label. */
export function genreIconKey(genre: string): string {
  const g = genre.trim().toLowerCase()

  if (/self-?portrait|tronie|catafalque|donor portrait|historiated|equestrian|group portrait|family portrait|double portrait|portrait/.test(g))
    return 'portrait'
  if (/nude|heroic nudity/.test(g)) return 'nude'
  if (/religious|altarpiece/.test(g)) return 'religious'
  if (/mytholog|arthurian/.test(g)) return 'myth'
  if (/allegor|vanitas|idyll/.test(g)) return 'allegory'
  if (/marine|veduta|cityscape|nocturne/.test(g)) return 'marine'
  if (/landscape|garden|topographic/.test(g)) return 'landscape'
  if (/still.?life|bodegón|floral|inverted still/.test(g)) return 'still-life'
  if (/animal|horse/.test(g)) return 'animal'
  if (/battle|history painting|schutterstuk/.test(g)) return 'history'
  if (/abstract|monochrome/.test(g)) return 'abstract'
  if (/expressionism|post-?impression|romanticism|naturalism|realism|baroque|fête|fete/.test(g))
    return 'movement'
  if (/handscroll/.test(g)) return 'scroll'
  if (/interior|atelier|art gallery|merry company/.test(g)) return 'interior'
  if (/genre art|figure|painting/.test(g)) return 'genre'
  return 'genre'
}
