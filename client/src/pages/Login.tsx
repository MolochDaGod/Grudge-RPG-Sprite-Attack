import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePuterAuth } from "@/contexts/PuterAuthContext";
import { User, Users, Key, Loader2, Swords } from "lucide-react";

interface LoginProps {
  onLogin: (authType: "puter" | "guest" | "local", username?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { signIn, isLoading, isAvailable } = usePuterAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePuterLogin = async () => {
    try {
      await signIn();
      onLogin("puter");
    } catch (err) {
      setError("Failed to sign in with Puter");
    }
  };

  const handleGuestLogin = () => {
    const guestName = `Guest_${Math.random().toString(36).substring(2, 8)}`;
    onLogin("guest", guestName);
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLocalLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLocalLoading(false);
    onLogin("local", username);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Swords className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Tethical</h1>
          </div>
          <p className="text-muted-foreground">
            Tactical Strategy RPG
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Choose how you want to play
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quick" data-testid="tab-quick-login">
                  Quick
                </TabsTrigger>
                <TabsTrigger value="puter" data-testid="tab-puter-login">
                  Cloud
                </TabsTrigger>
                <TabsTrigger value="local" data-testid="tab-local-login">
                  Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quick" className="space-y-4 mt-4">
                <div className="text-center space-y-2">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Jump right into the game. Your progress will be saved locally.
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleGuestLogin}
                  data-testid="button-guest-login"
                >
                  Play as Guest
                </Button>
              </TabsContent>

              <TabsContent value="puter" className="space-y-4 mt-4">
                <div className="text-center space-y-2">
                  <User className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Sign in with Puter to sync your progress across devices.
                  </p>
                </div>
                {isAvailable ? (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handlePuterLogin}
                    disabled={isLoading}
                    data-testid="button-puter-login"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in with Puter"
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Puter cloud services are not available in this environment.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="local" className="space-y-4 mt-4">
                <form onSubmit={handleLocalLogin} className="space-y-4">
                  <div className="text-center space-y-2 mb-4">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Create or sign in with a local account.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={localLoading}
                      data-testid="input-username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={localLoading}
                      data-testid="input-password"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center" data-testid="text-login-error">
                      {error}
                    </p>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={localLoading}
                    data-testid="button-local-login"
                  >
                    {localLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In / Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By playing, you accept that this is an early alpha version.
        </p>
      </div>
    </div>
  );
}
