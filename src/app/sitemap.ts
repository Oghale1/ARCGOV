import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { 
      url: "https://arcgov.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1 
    },
    { 
      url: "https://arcgov.vercel.app/governance",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9 
    },
    { 
      url: "https://arcgov.vercel.app/governance/aip-001",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.95 
    },
    { 
      url: "https://arcgov.vercel.app/validators",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8 
    },
    { 
      url: "https://arcgov.vercel.app/staking",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7 
    },
    { 
      url: "https://arcgov.vercel.app/quantum",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7 
    },
    { 
      url: "https://arcgov.vercel.app/architects",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8 
    },
    { 
      url: "https://arcgov.vercel.app/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5 
    },
    { 
      url: "https://arcgov.vercel.app/governance/calendar",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6 
    },
    { 
      url: "https://arcgov.vercel.app/embed",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4 
    }
  ]
}
