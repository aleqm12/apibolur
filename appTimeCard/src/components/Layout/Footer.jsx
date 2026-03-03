// eslint-disable-next-line no-unused-vars
import React from "react"; 
import { Container, Typography } from "@mui/material"; 
import Toolbar from "@mui/material/Toolbar"; 
export function Footer() { 
  return ( 
    <Toolbar 
      sx={{ 
        px: 2, 
        position: "fixed", 
        bottom: 0, 
        width: "100%", 
        height: "6rem",
        minHeight: "6rem", 
        backgroundColor: "#2B3036", 
        paddingTop: "1.5rem", 
        paddingBottom: "1.5rem", 
      }} 
    > 
      <Container> 
        <Typography align="center" variant="body2"> 
          <span style={{ color: '#ADB5BD' }}>© 2026 Bölur Engineers S.A.</span>
          <span style={{ color: '#9ea2a7' }}>
            {' '}| v1.0.0-release.01 | Todos los derechos reservados.
          </span>
        </Typography> 
      </Container> 
    </Toolbar> 
  ); 
} 
