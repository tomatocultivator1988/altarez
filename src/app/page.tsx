import type { Metadata } from "next"
export { default } from "./landing-client"

export const metadata: Metadata = {
  title: "Agrimalachina — Agricultural Machinery Platform",
  description:
    "Browse and rent agricultural machinery in Mina, Iloilo. Tractors, harvesters, tillers, and more — connecting farmers with equipment owners.",
  openGraph: {
    title: "Agrimalachina — Agricultural Machinery Platform",
    description: "Browse and rent agricultural machinery for your farming needs.",
    type: "website",
  },
}
