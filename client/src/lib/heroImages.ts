import heroBlackFemale from "@/assets/images/hero-black-female.png";
import heroBlackMale from "@/assets/images/hero-black-male.png";
import heroWhiteFemale from "@/assets/images/hero-white-female.png";
import heroWhiteMale from "@/assets/images/hero-white-male.png";
import heroHispanicFemale from "@/assets/images/hero-hispanic-female.png";
import heroHispanicMale from "@/assets/images/hero-hispanic-male.png";
import heroAsianFemale from "@/assets/images/hero-asian-female.png";
import heroAsianMale from "@/assets/images/hero-asian-male.png";

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
