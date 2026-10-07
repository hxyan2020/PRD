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
  if (/handscroll|hanging scroll|screen painting|shan shui|ink wash|literati|sumi|shuimo|nihonga|yamato|ukiyo|bird-and-flower|chinese painting|japanese painting|korean painting/.test(g))
    return 'scroll'
  if (/miniature|mughal|persian|rajput|pahari|thangka|company style|indian painting/.test(g))
    return 'scroll'
  if (/aboriginal|oceanic|pacific|maori|polynesian|melanes|micrones|southeast asian|balinese|indonesian|thai|vietnamese/.test(g))
    return 'landscape'
  if (/african|ethiopian|egyptian|coptic|islamic|ottoman|arabic calligraphy|north african|west african/.test(g))
    return 'religious'
  if (/mesoamerican|pre-?columbian|indigenous|native american|latin american|mexican mural|caribbean|andean|brazilian|american painting/.test(g))
    return 'history'
  if (/impressionism|surrealism|cubism|fauvism|symbolism|romanticism|realism|expressionism|baroque/.test(g))
    return 'movement'
  if (/interior|atelier|art gallery|merry company/.test(g)) return 'interior'
  if (/genre art|figure|painting/.test(g)) return 'genre'
  return 'genre'
}
