import { AvatarWithInfo } from "./AvatarWithInfo";
import { ProfileNavbar } from "./ProfileNavbar";
import ProfileBackground from "../../../../assets/background profile.jpg";

interface ProfileBannerProps {
  onProfileUpdateSuccess: () => void;
  refreshKey: number; // รับเพิ่ม
}

const ProfileBanner = ({ onProfileUpdateSuccess, refreshKey }: ProfileBannerProps) => {
  return (
    <div
      className="relative py-12 px-8 mb-8 rounded-xl overflow-hidden text-white bg-center bg-cover bg-no-repeat after:inline-block after:absolute after:inset-0 after:bg-black/60"
      style={{ backgroundImage: `url(${ProfileBackground})` }}
    >
      <div className="relative z-10">
        <AvatarWithInfo refreshKey={refreshKey} />
        <ProfileNavbar onUpdateSuccess={onProfileUpdateSuccess} />
      </div>
    </div>
  );
};

export { ProfileBanner };
