import React from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_LANDING_PAGES } from '../data/seoLandingPages';
import { SeoLandingTemplate } from '../components/seo/SeoLandingTemplate';
import { resolveRouteSeoPayload } from '../seo/routeMetadata';
import { NotFoundPage } from './NotFoundPage';

export const SeoLandingPage: React.FC = () => {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const config = SEO_LANDING_PAGES[normalizedPath];

  if (!config) {
    return <NotFoundPage />;
  }

  const routeSeo = resolveRouteSeoPayload(config.canonicalPath);

  return (
    <SeoLandingTemplate
      config={config}
      seoTitle={routeSeo.title}
      seoDescription={routeSeo.description}
    />
  );
};
