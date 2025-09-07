import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { ThumbsUp, MapPin, Clock, Filter, Search, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Types
interface ReportRow {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  latitude: number;
  longitude: number;
  status: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  issue_type: string;
}
interface PublicProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}
interface ReportWithExtras extends ReportRow {
  vote_count: number;
  user_has_voted: boolean;
  profile?: PublicProfile | null;
}
const PAGE_SIZE = 10;
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  "in_progress": "bg-blue-100 text-blue-800 border-blue-200"
};
export default function Home() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // SEO
  useEffect(() => {
    document.title = "FixTheMess – Report issues, vote, track resolutions";
    const desc = "Crowdsourced civic issues. Report problems, upvote, and track resolutions in real time.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);else {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      m.setAttribute("content", desc);
      document.head.appendChild(m);
    }
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (link) link.href = window.location.origin + "/";else {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = window.location.origin + "/";
      document.head.appendChild(l);
    }
  }, []);

  // Top voted carousel
  const [topVoted, setTopVoted] = useState<Array<{
    id: string;
    title: string;
    media_url: string;
    vote_count: number;
  }>>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const fetchTopVoted = async () => {
    const {
      data,
      error
    } = await supabase.rpc("get_top_voted_reports", {
      limit_count: 10
    });
    if (error) {
      console.error(error);
      return;
    }
    setTopVoted(data || []);
  };

  // Latest reports
  const [reports, setReports] = useState<ReportWithExtras[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const resetAndFetch = () => {
    setReports([]);
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
  };

  // Build query with filters
  const buildQuery = () => {
    let query = supabase.from("reports").select("*").order("created_at", {
      ascending: false
    });

    // Filter out hidden reports
    query = query.neq("status", "hidden");
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`title.ilike.${q},description.ilike.${q}`);
    }
    if (category) query = query.eq("issue_type", category);
    if (status) query = query.eq("status", status);
    return query;
  };
  const fetchPage = async (pageIndex: number, replace = false) => {
    if (loading || !hasMore && !replace) return;
    setLoading(true);
    try {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const {
        data,
        error
      } = await buildQuery().range(from, to);
      if (error) throw error;
      const rows = (data || []) as ReportRow[];
      // Profiles
      const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];
      let profiles: PublicProfile[] = [];
      if (userIds.length) {
        const {
          data: profs
        } = await supabase.rpc("get_public_profiles", {
          user_ids: userIds
        });
        profiles = profs || [];
      }
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // Votes count batch
      const reportIds = rows.map(r => r.id);
      const {
        data: counts
      } = await supabase.rpc("get_vote_counts", {
        report_ids: reportIds
      });
      const countMap = new Map((counts || []).map((c: any) => [c.report_id, c.vote_count as number]));

      // User votes (to highlight button)
      let votedSet = new Set<string>();
      if (user && reportIds.length) {
        const {
          data: userVotes
        } = await supabase.from("votes").select("report_id").eq("user_id", user.id).in("report_id", reportIds);
        votedSet = new Set((userVotes || []).map(v => v.report_id));
      }
      const enriched: ReportWithExtras[] = rows.map(r => ({
        ...r,
        vote_count: countMap.get(r.id) || 0,
        user_has_voted: user ? votedSet.has(r.id) : false,
        profile: r.user_id ? profileMap.get(r.user_id) || null : null
      }));
      setReports(prev => replace ? enriched : [...prev, ...enriched]);
      setHasMore(rows.length === PAGE_SIZE);
      setPage(pageIndex + 1);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Upvote
  const handleUpvote = async (reportId: string, current: boolean) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please sign in to vote",
        variant: "destructive"
      });
      return;
    }
    try {
      if (current) {
        const {
          error
        } = await supabase.from("votes").delete().eq("report_id", reportId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from("votes").insert({
          report_id: reportId,
          user_id: user.id
        });
        if (error) throw error;
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive"
      });
    }
  };

  // Realtime subscriptions
  useEffect(() => {
    fetchTopVoted();
    resetAndFetch();
    const channel = supabase.channel("home-realtime").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "votes"
    }, () => {
      fetchTopVoted();
    }).on("postgres_changes", {
      event: "DELETE",
      schema: "public",
      table: "votes"
    }, () => {
      fetchTopVoted();
    }).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "reports"
    }, () => resetAndFetch()).on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "reports"
    }, () => resetAndFetch()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, status]);

  // Carousel auto-scroll
  useEffect(() => {
    if (!carouselApi) return;
    const id = setInterval(() => carouselApi.scrollNext(), 4000);
    return () => clearInterval(id);
  }, [carouselApi]);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      const first = entries[0];
      if (first.isIntersecting) fetchPage(page);
    }, {
      rootMargin: "200px"
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [page]);
  const FilterBar = () => <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input className="pl-7 h-8 text-sm" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Select value={category} onValueChange={v => setCategory(v)}>
        <SelectTrigger className="w-full md:w-36 h-8 text-sm">
          <Filter className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pothole">Pothole</SelectItem>
          <SelectItem value="open_wire">Open Wire</SelectItem>
          <SelectItem value="garbage">Garbage</SelectItem>
          <SelectItem value="water_logging">Water</SelectItem>
          <SelectItem value="road_damage">Road</SelectItem>
          <SelectItem value="streetlight">Streetlight</SelectItem>
          <SelectItem value="sewage">Sewage</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={v => setStatus(v)}>
        <SelectTrigger className="w-full md:w-32 h-8 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>
    </div>;
  const CTA = () => null;
  const ReportCard = ({
    r
  }: {
    r: ReportWithExtras;
  }) => <Card className="hover:shadow-md transition-shadow">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img src={r.media_url} alt={r.title} loading="lazy" className="w-full h-full object-cover" onError={e => {
        (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
      }} />
        <Badge className={statusColors[r.status] || "bg-muted text-foreground border"}>
          {r.status === "in_progress" ? "In Progress" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={r.profile?.avatar_url || undefined} alt={r.profile?.username || "Reporter"} />
            <AvatarFallback>{(r.profile?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <button onClick={() => r.profile?.id && navigate(`/user/${r.profile.id}`)} className="story-link text-foreground">
              {r.is_anonymous ? "Anonymous Citizen" : r.profile?.username || r.profile?.name || "Citizen"}
            </button>
            <div className="text-muted-foreground text-xs">
              <Clock className="inline-block h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(r.created_at), {
              addSuffix: true
            })}
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{r.title}</h3>
        {r.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>}

        <div className="flex items-center justify-between">
          <Badge variant="outline">{r.issue_type}</Badge>
          <Button variant={r.user_has_voted ? "default" : "outline"} size="sm" onClick={() => handleUpvote(r.id, r.user_has_voted)} className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" /> {r.vote_count}
          </Button>
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/report/${r.id}`)}>
            View Details <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>;
  return <main className="container mx-auto px-4 py-6">
      {/* H1 for SEO */}
      <h1 className="sr-only">FixTheMess Community Reports</h1>


      {/* Top voted */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Top Voted Reports</h2>
          <Button variant="link" onClick={() => navigate("/reports")}>View All</Button>
        </div>
        <Carousel setApi={setCarouselApi} opts={{
        align: "start",
        loop: true
      }}>
          <CarouselContent>
            {topVoted.map(t => <CarouselItem key={t.id} className="basis-5/6 sm:basis-1/2 lg:basis-1/3">
                <Card onClick={() => navigate(`/report/${t.id}`)} className="cursor-pointer hover:shadow-md transition-shadow">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img src={t.media_url} alt={t.title} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{t.title}</h3>
                    <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" /> {t.vote_count} votes
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>)}
          </CarouselContent>
          <CarouselPrevious />
          
        </Carousel>
      </section>

      {/* Layout: main + sidebar */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* CTA Banner */}
          <CTA />

          {/* Filters */}
          <FilterBar />

          {/* Latest feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {reports.map(r => <ReportCard key={r.id} r={r} />)}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} />

          {/* Load state */}
          {loading && <div className="text-center text-sm text-muted-foreground">Loading...</div>}
          {!hasMore && reports.length > 0 && <div className="text-center text-sm text-muted-foreground">You\'re all caught up</div>}
          {reports.length === 0 && !loading && <div className="text-center text-sm text-muted-foreground">No reports found</div>}

          {/* Mobile CTA button */}
          <div className="md:hidden">
            <Button className="w-full mt-4" size="lg" onClick={() => navigate("/report/new")}>Report an Issue</Button>
          </div>
        </div>

        {/* Sidebar: Most Active Reporters (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <MostActiveReportersPanel />
          </div>
        </aside>
      </section>
    </main>;
}
function MostActiveReportersPanel() {
  const [rows, setRows] = useState<Array<{
    user_id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    report_count: number;
  }>>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const load = async () => {
      const {
        data,
        error
      } = await supabase.rpc("get_top_reporters_public", {
        limit_count: 5
      });
      if (!error) setRows(data || []);
    };
    load();
  }, []);
  return <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Most Active Reporters</h3>
          <Button variant="link" onClick={() => navigate("/top-reporters")}>View all</Button>
        </div>
        <ul className="space-y-3">
          {rows.map(u => <li key={u.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.avatar_url || undefined} alt={u.username || u.name || "Reporter"} />
                  <AvatarFallback>{(u.username || u.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <button className="text-sm text-left story-link" onClick={() => navigate(`/user/${u.user_id}`)}>
                  <div className="text-foreground">{u.username || u.name || "Citizen"}</div>
                  <div className="text-muted-foreground text-xs">{u.report_count} reports</div>
                </button>
              </div>
            </li>)}
        </ul>
      </CardContent>
    </Card>;
}