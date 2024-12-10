"use client";

import React from "react";
import { Box, IconButton, Menu, MenuItem, SvgIcon } from "@mui/material";
import { useRouter } from "next/navigation";
import { MenuSharp } from "@mui/icons-material";

const ROUTES = [
  { name: "About", route: "/about" },
  { name: "Help", route: "/help" },
  { name: "Map", route: "/" },
];

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
        <MenuSharp fontSize="large" />
      </IconButton>
      <Menu
        sx={{ opacity: 0.85 }}
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {ROUTES.map(({ name, route }) => (
          <MenuItem
            sx={{
              textDecoration:
                route === location.pathname ? "underline" : "none",
            }}
            key={name}
            onClick={() => router.push(route)}
          >
            {name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default HamburgerMenu;
