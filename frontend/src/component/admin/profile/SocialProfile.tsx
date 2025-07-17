import { Contact } from "./Contact/Contact";
import { ProfileBanner } from "./ProfileBanner/ProfileBanner";

const SocialProfile = () => {
  return (
    <div className="paddings mt-24 sm:mt-0 w-full">
      <ProfileBanner />
      <div className="w-full flex flex-col items-stretch relative z-10 mt-4">
        <Contact />
      </div>
    </div>
  );
};

export default SocialProfile;
