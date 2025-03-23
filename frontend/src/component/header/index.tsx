import { Button } from "@mui/material"
import { HiOutlineMenuAlt1 } from "react-icons/hi";
import Badge, { BadgeProps } from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { FaRegBell } from "react-icons/fa6";

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

const index = () => {
  return (
    <div>
      <header className="w-full h-[50px] pl-52 pr-7 bg-[#f1f1f1] flex items-center justify-between">
        <div className="part1">
          <Button className="!w-[40px] !h-[40px] !rounded-full !min-w-[40px] text-[rgba(0,0,0,0.8)]">
            <HiOutlineMenuAlt1 className="text-[22px] text-[rgba(0,0,0,0.8)]" />
          </Button>
        </div>
        <div className="part2 w-[40%] flex items-center justify-end gap-3">
          <IconButton aria-label="cart">
            <StyledBadge badgeContent={4} color="secondary">
              <FaRegBell />
            </StyledBadge>
          </IconButton>
        </div>
      </header>
    </div>
  )
}

export default index