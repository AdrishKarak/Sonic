import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: ['/landing'],
      disallow: [
        '/api/',
        '/org-selection/',
        '/text-to-speech/',
        '/voices/',
        '/test/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
