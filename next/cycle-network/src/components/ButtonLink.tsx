import React from "react";
import { Box, Link } from "@mui/material";

interface ButtonLinkProps {
  children: string;
  color?: string;
  onClick: () => void;
}

const ButtonLink: React.FC<ButtonLinkProps> = ({
  children,
  color,
  onClick,
}) => (
  <Box component="span" sx={{ cursor: "pointer" }} onClick={onClick}>
    <Link color={color || "inherit"}>{children}</Link>
  </Box>
);

export default ButtonLink;
