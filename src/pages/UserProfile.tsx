import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<{ id: string; name: string | null; username: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    document.title = `User Profile – FixTheMess`;
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.rpc("get_public_profiles", { user_ids: [id] });
      setProfile((data && data[0]) || null);
    };
    load();
  }, [id]);

  if (!profile) return <div className="container mx-auto px-4 py-6">Loading...</div>;

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">{profile.username || profile.name || "Citizen"}</h1>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || "User"} />
            <AvatarFallback>{(profile.username || "U").slice(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm text-muted-foreground">Public profile</div>
            <div className="text-lg font-semibold">{profile.username || profile.name || "Citizen"}</div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
