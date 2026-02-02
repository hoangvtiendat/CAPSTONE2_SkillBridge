/**
 * Mock data for job listings
 * Sau này sẽ thay bằng API calls
 */

export const jobsCardsMockData = [
  {
    id: 1,
    position: 'Frontend Engineer',
    company: 'Spotify',
    location: 'Remote',
    salary: { min: 3000, max: 5100 },
    jobType: 'Full-time',
    tags: ['React', 'Tailored'],
    logo: 'S',
    featured: false
  },
  {
    id: 2,
    position: 'Senior UX Designer',
    company: 'Google Inc.',
    location: 'Mountain View',
    salary: { min: 3100, max: 5100 },
    jobType: 'Full-time',
    tags: ['Prototyping'],
    logo: 'G',
    featured: false
  },
  {
    id: 3,
    position: 'Senior UX Designer',
    company: 'Google Inc.',
    location: 'Mountain View',
    salary: { min: 3100, max: 5100 },
    jobType: 'Contract',
    tags: ['Figma', 'Prototyping'],
    logo: 'G',
    featured: true
  },
  {
    id: 4,
    position: 'Senior UX Designer',
    company: 'Google Inc.',
    location: 'Mountain View',
    salary: { min: 3100, max: 5100 },
    jobType: 'Part-time',
    tags: [],
    logo: 'G',
    featured: false
  },
  {
    id: 5,
    position: 'Product Manager',
    company: 'Microsoft',
    location: 'Seattle',
    salary: { min: 4000, max: 6200 },
    jobType: 'Full-time',
    tags: ['Leadership', 'Strategy'],
    logo: 'M',
    featured: false
  },
  {
    id: 6,
    position: 'Backend Engineer',
    company: 'Amazon',
    location: 'New York',
    salary: { min: 3500, max: 5800 },
    jobType: 'Full-time',
    tags: ['Node.js', 'AWS'],
    logo: 'A',
    featured: false
  }
];
