import SmallLogoImage from "@/assets/penta-core.png";
import LargeLogoImage from "@/assets/penta-logo.png";

export const Logo: React.FC<{ large?: boolean }> = ({ large }) => {
  if (large) {
    return (
      <img src={LargeLogoImage} alt="Penta" className="object-contain h-full" />
    );
  } else {
    return (
      <img src={SmallLogoImage} alt="Penta" className="object-contain h-full" />
    );
  }
};
