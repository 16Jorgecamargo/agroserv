export type Coordinates = [number, number]

const EARTH_RADIUS_KM = 6371

const CITY_TABLE: [string, string, number, number][] = [
  ['Cascavel', 'PR', -24.9555, -53.4552],
  ['Toledo', 'PR', -24.7246, -53.7412],
  ['Foz do Iguaçu', 'PR', -25.5469, -54.5882],
  ['Marechal Cândido Rondon', 'PR', -24.556, -54.0567],
  ['Santa Helena', 'PR', -24.8604, -54.333],
  ['Medianeira', 'PR', -25.295, -54.094],
  ['Palotina', 'PR', -24.2868, -53.8404],
  ['Assis Chateaubriand', 'PR', -24.4168, -53.5213],
  ['Guaíra', 'PR', -24.085, -54.2573],
  ['Matelândia', 'PR', -25.241, -53.9963],
  ['Céu Azul', 'PR', -25.1489, -53.8415],
  ['São Miguel do Iguaçu', 'PR', -25.3487, -54.2377],
  ['Missal', 'PR', -25.0919, -54.2477],
  ['Itaipulândia', 'PR', -25.1366, -54.3001],
  ['Pato Bragado', 'PR', -24.6271, -54.2265],
  ['Entre Rios do Oeste', 'PR', -24.7042, -54.2385],
  ['Mercedes', 'PR', -24.4538, -54.1618],
  ['Quatro Pontes', 'PR', -24.5752, -53.9759],
  ['Nova Santa Rosa', 'PR', -24.4693, -53.9552],
  ['Maripá', 'PR', -24.42, -53.8286],
  ['Terra Roxa', 'PR', -24.1575, -54.0988],
  ['Ouro Verde do Oeste', 'PR', -24.7933, -53.9043],
  ['São Pedro do Iguaçu', 'PR', -24.9373, -53.8521],
  ['Tupãssi', 'PR', -24.5879, -53.5105],
  ['Corbélia', 'PR', -24.7971, -53.3066],
  ['Santa Tereza do Oeste', 'PR', -25.0543, -53.6274],
  ['Capitão Leônidas Marques', 'PR', -25.4816, -53.6112],
  ['Ubiratã', 'PR', -24.5393, -52.9865],
  ['Goioerê', 'PR', -24.1835, -53.0248],
  ['Umuarama', 'PR', -23.7656, -53.3201],
  ['Francisco Beltrão', 'PR', -26.0817, -53.0535],
  ['Pato Branco', 'PR', -26.2295, -52.6716],
  ['Laranjeiras do Sul', 'PR', -25.4077, -52.4109],
  ['Guarapuava', 'PR', -25.3907, -51.4628],
  ['Ponta Grossa', 'PR', -25.0916, -50.1668],
  ['Maringá', 'PR', -23.4205, -51.9333],
  ['Londrina', 'PR', -23.3045, -51.1696],
  ['Curitiba', 'PR', -25.4284, -49.2733],
]

export function normalizeCityKey(city: string, state: string): string {
  const name = city
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  return `${name}|${state.trim().toUpperCase()}`
}

const CITY_COORDINATES = new Map<string, Coordinates>(
  CITY_TABLE.map(([city, state, latitude, longitude]) => [normalizeCityKey(city, state), [latitude, longitude]]),
)

export const DEFAULT_MAP_CENTER: Coordinates = [-24.9555, -53.4552]

export function findCityCoordinates(city: string, state: string): Coordinates | null {
  return CITY_COORDINATES.get(normalizeCityKey(city, state)) ?? null
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = toRadians(to[0] - from[0])
  const longitudeDelta = toRadians(to[1] - from[1])
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(from[0])) * Math.cos(toRadians(to[0])) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine))
}

export function distanceBetweenCities(
  from: { city: string; state: string },
  to: { city: string; state: string },
): number | null {
  const origin = findCityCoordinates(from.city, from.state)
  const destination = findCityCoordinates(to.city, to.state)
  if (!origin || !destination) return null
  return distanceKm(origin, destination)
}
