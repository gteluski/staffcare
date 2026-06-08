import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User, Camera, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateMyProfile, setMyAvatarPath } from "@/lib/profile-security";

const pastoralTitles = ["Pastor", "Pastora", "Reverendo", "Reverenda", "Bispo", "Bispa"];

export default function Perfil() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    pastoral_title: "Pastor",
    church_name: "",
    district: "",
    region: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        pastoral_title: profile.pastoral_title || "Pastor",
        church_name: profile.church_name || "",
        district: profile.district || "",
        region: profile.region || "",
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateMyProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        pastoral_title: form.pastoral_title,
        church_name: form.church_name.trim(),
        district: form.district.trim(),
        region: form.region.trim(),
      });
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas com sucesso." });
    } catch {
      toast({ title: "Erro ao salvar", description: "Não foi possível atualizar seu perfil. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getSignedAvatarUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60); // 1 hour
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };

  // Resolve avatar URL on mount / profile change
  useEffect(() => {
    if (!profile?.avatar_url) { setAvatarUrl(null); return; }
    // If it's a path (not a full URL), generate a signed URL
    const raw = profile.avatar_url;
    if (raw.startsWith("http")) {
      // Legacy public URL — still display it but will migrate on next upload
      setAvatarUrl(raw);
    } else {
      getSignedAvatarUrl(raw).then((url) => setAvatarUrl(url));
    }
  }, [profile?.avatar_url]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Selecione uma imagem (JPG, PNG, etc.).", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A foto deve ter no máximo 2 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const randomSuffix = crypto.randomUUID().slice(0, 8);
    const filePath = `${user.id}/${randomSuffix}.${ext}`;

    // Remove old files first
    const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage.from("avatars").remove(existingFiles.map((f) => `${user.id}/${f.name}`));
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast({ title: "Erro no upload", description: "Não foi possível enviar a foto. Tente novamente.", variant: "destructive" });
      return;
    }

    // Store the FILE PATH (not public URL) in the profile
    await setMyAvatarPath(filePath);

    // Get signed URL for display
    const signedUrl = await getSignedAvatarUrl(filePath);
    setAvatarUrl(signedUrl);
    setUploading(false);
    await refreshProfile();
    toast({ title: "Foto atualizada", description: "Sua foto de perfil foi salva." });
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploading(true);

    // Remove from storage
    const { data: files } = await supabase.storage.from("avatars").list(user.id);
    if (files && files.length > 0) {
      await supabase.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
    }

    await setMyAvatarPath(null);
    setAvatarUrl(null);
    setUploading(false);
    await refreshProfile();
    toast({ title: "Foto removida", description: "Sua foto de perfil foi removida." });
  };

  const initials = (form.full_name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const field = (label: string, key: keyof typeof form, placeholder: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
      <Input
        id={key}
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        maxLength={200}
      />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e pastorais.</p>
      </div>

      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={avatarUrl || undefined} alt="Foto de perfil" />
              <AvatarFallback className="text-lg font-heading bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                  {avatarUrl ? "Trocar foto" : "Enviar foto"}
                </Button>
                {avatarUrl && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={uploading} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG ou PNG, máximo 2 MB.</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">E-mail</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pastoral_title" className="text-sm font-medium">Título Pastoral</Label>
            <Select value={form.pastoral_title} onValueChange={(v) => setForm((f) => ({ ...f, pastoral_title: v }))}>
              <SelectTrigger id="pastoral_title">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pastoralTitles.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field("Nome Completo", "full_name", "Seu nome completo")}
          {field("Telefone", "phone", "(11) 99999-9999", "tel")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Igreja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {field("Nome da Igreja", "church_name", "Ex: Igreja Metodista Central")}
          {field("Distrito", "district", "Ex: 1º Distrito")}
          {field("Região", "region", "Ex: 1ª Região Eclesiástica")}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
