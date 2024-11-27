import { Box, Link } from "@mui/material";
import React from "react";

interface ButtonLinkProps {
  children: string;
  onClick: () => void;
}

const ButtonLink: React.FC<ButtonLinkProps> = ({ onClick, children }) => (
  <Box component="span" sx={{ cursor: "pointer" }} onClick={onClick}>
    <Link>{children}</Link>
  </Box>
);

export default ButtonLink;
