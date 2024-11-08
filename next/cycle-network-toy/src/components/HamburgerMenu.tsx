"use client";

import React from "react";
import { Box, IconButton, Menu, MenuItem, SvgIcon } from "@mui/material";
import { useRouter } from "next/navigation";

interface HamburgerMenuProps {
  absolute: boolean;
  backgroundColor?: string;
  color?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  absolute,
  backgroundColor,
  color,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const router = useRouter();

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);

  const handleClose = () => setAnchorEl(null);

  return (
    <Box
      sx={{
        backgroundColor: backgroundColor || "white",
        borderRadius: "2px",
        opacity: 0.85,
        ...(absolute
          ? {
              position: "absolute",
              right: 10,
              top: 10,
              zIndex: 1000,
            }
          : {}),
      }}
    >
      <IconButton onClick={handleClick}>
        <SvgIcon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill={color || "black"}
          >
            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
          </svg>
        </SvgIcon>
      </IconButton>
      <Menu
        sx={{ opacity: 0.85 }}
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => router.push("/help")}>Help</MenuItem>
        <MenuItem onClick={() => router.push("/about")}>About</MenuItem>
      </Menu>
    </Box>
  );
};

export default HamburgerMenu;
