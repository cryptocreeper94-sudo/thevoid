import heroBlackFemale from "@/assets/images/hero-black-female.webp";
import heroBlackMale from "@/assets/images/hero-black-male.webp";
import heroWhiteFemale from "@/assets/images/hero-white-female.webp";
import heroWhiteMale from "@/assets/images/hero-white-male.webp";
import heroHispanicFemale from "@/assets/images/hero-hispanic-female.webp";
import heroHispanicMale from "@/assets/images/hero-hispanic-male.webp";
import heroAsianFemale from "@/assets/images/hero-asian-female.webp";
import heroAsianMale from "@/assets/images/hero-asian-male.webp";

const heroImages = [
  heroBlackFemale,
  heroBlackMale,
  heroWhiteFemale,
  heroWhiteMale,
  heroHispanicFemale,
  heroHispanicMale,
  heroAsianFemale,
  heroAsianMale,
];

const SESSION_KEY = "void-hero-index";

function getSessionHeroIndex(): number {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored !== null) {
    return parseInt(stored, 10);
  }
  const index = Math.floor(Math.random() * heroImages.length);
  sessionStorage.setItem(SESSION_KEY, String(index));
  return index;
}

export function getSessionHeroImage(): string {
  return heroImages[getSessionHeroIndex()];
}
