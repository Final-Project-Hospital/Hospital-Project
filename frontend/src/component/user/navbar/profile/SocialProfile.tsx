import { useRefresh } from "./RefreshContext";
import { Contact } from "./Contact/Contact";
import { ProfileBanner } from "./ProfileBanner/ProfileBanner";

const SocialProfile = () => {
  const { refreshKey, triggerRefresh } = useRefresh();

  return (
    <div className="paddings mt-16 sm:mt-0 w-full">
      <ProfileBanner onProfileUpdateSuccess={triggerRefresh} refreshKey={refreshKey} />
      <div className="w-full flex flex-col items-stretch relative z-10 mt-4">
        <Contact refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default SocialProfile;
