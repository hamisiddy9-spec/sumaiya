"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Briefcase, MapPin, DollarSign, TrendingUp, ArrowRight, Loader2, AlertCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t, type Lang } from "@/lib/i18n/translations";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  skills?: string[];
  matchScore?: number;
  matchReason?: string;
}

interface JobFeedClientProps {
  sw?: boolean;
  onSendCV?: (jobId: string) => void;
}

export function JobFeedClient({ sw = false, onSendCV }: JobFeedClientProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/jobs/feed?limit=20&minScore=50");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = (await res.json()) as { success: boolean; data?: Job[] };
      if (data.data) {
        setJobs(data.data);
        setFilteredJobs(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          job.skills?.some((s) => s.toLowerCase().includes(term))
      );
    }

    if (filterLocation) {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    if (filterCompany) {
      filtered = filtered.filter((job) =>
        job.company.toLowerCase().includes(filterCompany.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [searchTerm, filterLocation, filterCompany, jobs]);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-ember" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 mb-1">
            {sw ? "Kosa Limetokea" : "Error loading jobs"}
          </h3>
          <p className="text-sm text-red-700">{error}</p>
          <Button onClick={fetchJobs} variant="ghost" size="sm" className="mt-2">
            {sw ? "Jaribu Tena" : "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
        <p className="text-text-muted">
          {sw ? "Hakuna ajira iliyopatikana kwa sasa" : "No jobs available yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder={sw ? "Tafuta ajira..." : "Search jobs..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:col-span-1"
        />
        <Input
          placeholder={sw ? "Jiji..." : "Location..."}
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        />
        <Input
          placeholder={sw ? "Kampuni..." : "Company..."}
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-text-muted">
        {filteredJobs.length > 0 ? (
          <>
            {sw ? "Inaonyesha " : "Showing "} <strong>{filteredJobs.length}</strong>{" "}
            {sw ? "ajira" : "jobs"}
          </>
        ) : (
          <>{sw ? "Hakuna ajira inayolingana" : "No matching jobs"}</>
        )}
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {filteredJobs.map((job) => {
          const isExpanded = expandedJobId === job.id;
          const isSaved = savedJobs.has(job.id);

          return (
            <Card
              key={job.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Collapsed View */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-espresso text-base leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">{job.company}</p>
                  </div>
                  {job.matchScore && (
                    <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        {Math.round(job.matchScore)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 flex-wrap mb-3 text-sm text-text-muted">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.salary && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                </div>

                {/* Match Reason */}
                {job.matchReason && (
                  <p className="text-xs text-text-muted mb-3 italic">
                    {sw ? "Inayolingana kwa: " : "Matches: "}{job.matchReason}
                  </p>
                )}

                {/* Skills Tags */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="neutral" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 3 && (
                      <Badge variant="neutral" className="text-xs">
                        +{job.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                    className="text-ember hover:text-ember-hover font-medium text-sm flex items-center gap-1"
                  >
                    {isExpanded ? (sw ? "Kufa" : "Hide") : (sw ? "Angalia Zaidi" : "View Details")}
                    <ArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </button>
                  <button
                    onClick={() => toggleSaveJob(job.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isSaved
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-100 text-text-muted hover:text-red-600"
                    }`}
                  >
                    <Heart className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>

              {/* Expanded View */}
              {isExpanded && (
                <div className="border-t border-border bg-bg-elevated p-4 space-y-4">
                  {/* Full Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-espresso mb-2">
                      {sw ? "Maelezo ya Kazi" : "Job Description"}
                    </h4>
                    <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>

                  {/* All Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-espresso mb-2">
                        {sw ? "Ujuzi Unaohitajika" : "Required Skills"}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, idx) => (
                          <Badge key={idx} variant="neutral">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`https://example.com/jobs/${job.id}`, "_blank")}
                    >
                      {sw ? "Tazama Karibu Ajira" : "View Full Job"}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onSendCV?.(job.id)}
                    >
                      {sw ? "Tuma CV" : "Send My CV"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
