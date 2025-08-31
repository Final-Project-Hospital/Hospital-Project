import { useState, useRef } from "react";
import Signin from "./Signin";
import Login from "./Login";
import ForgotPassword from "./forgot";
import Logo from "../../../assets/background profile.jpg";

const LoginPopup = ({ loginPopup, handleLoginPopup }: any) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const loginPopupRef = useRef<HTMLDivElement>(null);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === loginPopupRef.current) {
      handleLoginPopup(false);
    }
  };

  return (
    <>
      {loginPopup && (
        <div
          ref={loginPopupRef}
          onClick={handleBgClick}
          className="fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center bg-black/20"
        >
          <div className="
            bg-white rounded-2xl shadow-lg flex flex-col 
            md:flex-row w-full max-w-5xl mx-2 my-8 overflow-hidden
          ">
            {/* Left - Image */}
            <div className="
              hidden md:flex flex-col justify-between items-start
              w-1/2 min-w-[320px] max-w-[520px]
              bg-gradient-to-t from-teal-100 to-white relative
            ">
              <img
                src={Logo}
                alt="Logo"
                className="w-full h-full object-cover absolute inset-0 opacity-70"
              />
            </div>

            {/* Right - Content */}
            <div className="
              flex-1 w-full
              min-w-[260px] sm:min-w-[340px] md:min-w-[360px] lg:min-w-[400px]
              max-w-full
              p-4 sm:p-8 lg:p-14
              flex flex-col justify-center bg-white
            ">
              {showSignIn ? (
                <Signin handleSignIn={() => setShowSignIn(false)} />
              ) : showForgot ? (
                <ForgotPassword handleBack={() => setShowForgot(false)} />
              ) : (
                <Login 
                  handleSignIn={() => setShowSignIn(true)} 
                  handleForgot={() => setShowForgot(true)} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPopup;
