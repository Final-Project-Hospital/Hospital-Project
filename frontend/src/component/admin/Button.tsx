import { useStateContext } from '../../contexts/ContextProvider';

type ButtonProps = {
  icon?: React.ReactNode;
  bgColor?: string;
  color?: string;
  bgHoverColor?: string;
  size?: string;
  text?: string;
  borderRadius?: string;
  width?: string;
  onClick?: () => void; 
};

const Button = ({ icon, bgColor, color, bgHoverColor, size = 'base', text, borderRadius, width = 'auto', onClick }: ButtonProps) => {
  const { setIsClicked, initialState } = useStateContext();

  return (
    <button
      type="button"// @ts-ignore
      onClick={(e) => {
        setIsClicked(initialState); 
        onClick?.(); 
      }}
      style={{ backgroundColor: bgColor, color, borderRadius }}
      className={`text-${size} p-3 ${width === 'full' ? 'w-full' : ''} hover:drop-shadow-xl hover:bg-${bgHoverColor}`}
    >
      {icon} {text}
    </button>
  );
};

export default Button;
