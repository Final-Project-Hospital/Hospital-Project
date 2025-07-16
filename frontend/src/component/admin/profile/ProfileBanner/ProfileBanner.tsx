import { AvatarWithInfo } from "./AvatarWithInfo";
import { ProfileNavbar } from "./ProfileNavbar";
import EVCAR from "../../../../assets/background profile.jpg"

const ProfileBanner = () => {
  return (
    <div
      className="relative py-12 px-8 mb-8 rounded-xl overflow-hidden text-white bg-center bg-cover bg-no-repeat after:inline-block after:absolute after:inset-0 after:bg-black/60"
      style={{ backgroundImage: `url(${EVCAR})` }}
    >
      <div className="relative z-10">
        <AvatarWithInfo />
        <ProfileNavbar />
      </div>
    </div>
  );
};

export { ProfileBanner };
