/**
 * POST /api/jobs/feed - Get job feed (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Local-first seed: Tanzanian roles plus a couple of nearby East African
// neighbours. Sumaiya's audience is job-seekers in Tanzania, so the feed leads
// with Dar es Salaam / Dodoma / Mwanza / Arusha / Zanzibar, not remote Silicon
// Valley roles. This is placeholder data until a real jobs source is wired.
const MOCK_JOBS = [
  {
    id: '1',
    title: 'Storekeeper',
    company: 'Kilimanjaro Retail Ltd',
    location: 'Dar es Salaam',
    salary: 'TZS 800,000 – 1,200,000',
    description: 'Manage stock, keep bin cards and run weekly cycle counts for a busy retail warehouse.',
    requirements: ['Inventory management', 'Excel', 'Stock reconciliation'],
    postedAt: new Date()
  },
  {
    id: '2',
    title: 'Sales & Marketing Officer',
    company: 'Jangwani Telecom',
    location: 'Dar es Salaam',
    salary: 'TZS 700,000 – 1,000,000',
    description: "Sell mobile devices and accessories; follow up leads and grow the shop's customer base.",
    requirements: ['Sales', 'Customer service', 'Communication'],
    postedAt: new Date()
  },
  {
    id: '3',
    title: 'Accountant',
    company: 'Mwananchi Foods',
    location: 'Dodoma',
    salary: 'TZS 1,200,000 – 1,800,000',
    description: 'Reconcile ledgers, prepare monthly reports and manage supplier payments.',
    requirements: ['Accounting', 'Excel', 'QuickBooks'],
    postedAt: new Date()
  },
  {
    id: '4',
    title: 'Delivery Rider',
    company: 'Bora Logistics',
    location: 'Dar es Salaam',
    salary: 'TZS 450,000 – 700,000',
    description: 'Deliver parcels across the city on a motorbike; valid licence and two years riding required.',
    requirements: ['Valid riding licence', 'City navigation'],
    postedAt: new Date()
  },
  {
    id: '5',
    title: 'Customer Service Agent',
    company: 'Vodacom Tanzania',
    location: 'Mwanza',
    salary: 'TZS 600,000 – 850,000',
    description: 'Serve customers at the service desk and resolve billing and network queries.',
    requirements: ['Customer service', 'Swahili & English'],
    postedAt: new Date()
  },
  {
    id: '6',
    title: 'Primary School Teacher',
    company: 'St. Joseph Academy',
    location: 'Arusha',
    salary: 'TZS 900,000 – 1,300,000',
    description: 'Teach lower primary; prepare lesson plans and assess learners.',
    requirements: ['Teaching certificate', 'Classroom management'],
    postedAt: new Date()
  },
  {
    id: '7',
    title: 'Front Desk Receptionist',
    company: 'Zanzibar Beach Resort',
    location: 'Zanzibar',
    salary: 'TZS 700,000 – 1,000,000',
    description: 'Welcome guests, manage bookings and coordinate with housekeeping.',
    requirements: ['Customer service', 'English', 'Booking systems'],
    postedAt: new Date()
  },
  {
    id: '8',
    title: 'Operations Assistant',
    company: 'Kenya Logistics Hub',
    location: 'Nairobi',
    salary: 'KES 60,000 – 90,000',
    description: 'Support warehouse and dispatch operations for a cross-border logistics firm.',
    requirements: ['Operations', 'Excel', 'Coordination'],
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
      results = results.filter(job => job.location.toLowerCase().includes(filters.location.toLowerCase()));
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
