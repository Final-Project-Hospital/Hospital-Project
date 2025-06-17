import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash, FaLinkedinIn } from "react-icons/fa";

const Signin = ({ handleSignIn }: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl text-gray-600 font-semibold text-center mb-4">
          Create Your Account
        </h1>
        <form className="flex flex-col gap-3">
          <div>
            <label htmlFor="username" className="login-input-label">
              Username
            </label>
            <input id="username" type="text" className="login-input" />
          </div>
          <div>
            <label htmlFor="email" className="login-input-label">
              Email
            </label>
            <input id="email" type="email" className="login-input" />
          </div>
          <div>
            <label htmlFor="password" className="login-input-label">
              Password
            </label>
            <div className="relative">
              <input
                className="login-input pr-8"
                id="password"
                type={showPassword ? "text" : "password"}
              />
              {showPassword ? (
                <FaEye
                  className="text-gray-500 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <FaEyeSlash
                  className="text-gray-500 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              )}
            </div>
          </div>
        </form>
        <button className="bg-blue-500 text-white py-1 px-5 rounded-full mt-7 block w-full hover:bg-blue-500/80 login-transition-200">
          Create Account
        </button>
        <p className="text-center text-gray-500 text-sm my-3">or login with</p>
        <div className="flex gap-4 justify-center">
          <FcGoogle className="text-2xl grayscale hover:grayscale-0 login-transition-200" />
          <FaLinkedinIn className="text-2xl text-gray-600 hover:text-blue-600 login-transition-200" />
        </div>
        <p
          className="text-center text-gray-500 text-sm my-3 hover:text-blue-700 cursor-pointer"
          onClick={handleSignIn}
        >
          Already have an Account? Log in
        </p>
      </div>
    </>
  );
};

export default Signin;
