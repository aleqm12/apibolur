// eslint-disable-next-line no-unused-vars
import React from 'react'; 
import PropTypes from 'prop-types'; 
import { Container } from '@mui/material'; 
import Header from './Header'; 
import { Footer } from './Footer'; 
import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
 
Layout.propTypes = { children: PropTypes.node.isRequired }; 
 
export function Layout({ children }) { 
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isCreateProject = location.pathname === '/project/crear/';
  const showHeader = location.pathname !== '/' && !isCreateProject;
  const isFullBleedPage = isHome || isCreateProject;

  return ( 
    <> 
      {showHeader && <Header />} 
      <Container 
        maxWidth={isFullBleedPage ? false : 'xl'} 
        disableGutters={isFullBleedPage}
        style={{ paddingTop: isFullBleedPage ? 0 : '1rem', paddingBottom: '6rem' }} 
      > 
      <Toaster position='bottom-right' />
        {children} 
      </Container> 
      <Footer /> 
    </> 
  ); 
} 