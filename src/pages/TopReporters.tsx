import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TopReporters() {
  const [rows, setRows] = useState<Array<{ user_id: string; name: string | null; username: string | null; avatar_url: string | null; report_count: number }>>([]);

  useEffect(() => {
    document.title = "Top Reporters – FixTheMess";
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.rpc("get_top_reporters_public", { limit_count: 20 });
      setRows(data || []);
    };
    load();
  }, []);

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Top Reporters</h1>
      <Card>
        <CardContent className="p-4">
          <ul className="divide-y">
            {rows.map((u) => (
              <li key={u.user_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || undefined} alt={u.username || u.name || "Reporter"} />
                    <AvatarFallback>{(u.username || u.name || "U").slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{u.username || u.name || "Citizen"}</div>
                    <div className="text-xs text-muted-foreground">{u.report_count} reports</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
