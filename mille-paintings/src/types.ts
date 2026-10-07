export type Painting = {
  id: string
  rank: number
  sitelinks: number
  name: string
  image: string
  imageFull: string
  painter: string
  painterId: string
  painterBirthYear: string
  painterDeathYear: string
  painterCountry: string
  placeOfCreation: string
  collection: string
  lostOrDestroyed: boolean
  intro: string
  genre: string
  anecdote: string
  painterPhotos: string[]
}

export type PaintingsPayload = {
  generatedAt: string
  source: string
  count: number
  paintings: Painting[]
}
