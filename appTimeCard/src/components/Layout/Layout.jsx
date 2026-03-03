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
  const showHeader = location.pathname !== '/';

  return ( 
    <> 
      {showHeader && <Header />} 
      <Container 
        maxWidth={isHome ? false : 'xl'} 
        disableGutters={isHome}
        style={{ paddingTop: isHome ? 0 : '1rem', paddingBottom: '6rem' }} 
      > 
      <Toaster position='bottom-right' />
        {children} 
      </Container> 
      <Footer /> 
    </> 
  ); 
} 