/**
 * POST /api/jobs/feed - Get job feed (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const MOCK_JOBS = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'Tech Corp',
    location: 'Remote',
    salary: '$120k - $150k',
    description: 'Looking for experienced React developer with 5+ years experience',
    requirements: ['React', 'TypeScript', 'Node.js'],
    postedAt: new Date()
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'StartUp Inc',
    location: 'Nairobi',
    salary: '$80k - $120k',
    description: 'Build scalable web applications',
    requirements: ['React', 'Node.js', 'AWS'],
    postedAt: new Date()
  },
  {
    id: '3',
    title: 'Backend Engineer',
    company: 'CloudTech',
    location: 'Remote',
    salary: '$100k - $130k',
    description: 'Design and build distributed systems',
    requirements: ['Node.js', 'Go', 'Docker', 'Kubernetes'],
    postedAt: new Date()
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    company: 'Enterprise Solutions',
    location: 'Bangalore',
    salary: '$90k - $125k',
    description: 'Manage cloud infrastructure and CI/CD pipelines',
    requirements: ['AWS', 'Docker', 'CI/CD', 'Linux'],
    postedAt: new Date()
  },
  {
    id: '5',
    title: 'Data Engineer',
    company: 'Analytics Firm',
    location: 'Remote',
    salary: '$110k - $140k',
    description: 'Build data pipelines and analytics infrastructure',
    requirements: ['Python', 'SQL', 'Spark', 'Cloud'],
    postedAt: new Date()
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page = 1, limit = 10, search, filters } = body;

    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;

    let results = [...MOCK_JOBS];

    // Apply search filter
    if (search) {
      results = results.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply other filters
    if (filters?.location) {
      results = results.filter(job => job.location.includes(filters.location));
    }

    if (filters?.minSalary) {
      results = results.filter(job => {
        const max = parseInt(job.salary.split('-')[1]);
        return max >= filters.minSalary;
      });
    }

    // Paginate
    const paginatedResults = results.slice(startIdx, endIdx);
    const totalCount = results.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      jobs: paginatedResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Jobs feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
