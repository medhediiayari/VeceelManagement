"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Anchor, Eye, EyeOff, Loader2, Ship, Waves, Shield, Navigation, Wrench, UserCog, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Demo accounts for quick login (using database credentials)
const DEMO_ACCOUNTS = [
  { 
    id: "admin", 
    label: "Admin", 
    icon: UserCog, 
    email: "admin@vesselms.com",
    password: "password123"
  },
  { 
    id: "cso", 
    label: "CSO", 
    icon: Shield, 
    email: "cso@vesselms.com",
    password: "password123"
  },
  { 
    id: "capitaine", 
    label: "Capitaine", 
    icon: Navigation, 
    email: "capitaine.oceanstar@vesselms.com",
    password: "password123"
  },
  { 
    id: "chef-mecanicien", 
    label: "Mécanicien", 
    icon: Wrench, 
    email: "mecano.oceanstar@vesselms.com",
    password: "password123"
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Erreur de connexion")
        setIsLoading(false)
        return
      }

      // Redirect to appropriate dashboard
      router.push(data.redirectPath || "/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("Erreur de connexion au serveur")
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setFormData({
      email: account.email,
      password: account.password,
      rememberMe: false,
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-float" />
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
          <svg viewBox="0 0 1440 320" className="w-full h-full">
            <path
              fill="currentColor"
              className="text-white"
              d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Anchor className="h-10 w-10" />
            </div>
            <span className="text-3xl font-bold tracking-tight">VesselMS</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Vessel Management
            <br />
            <span className="text-white/80">Made Simple</span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-md mb-8">
            Streamline your fleet operations with our comprehensive vessel management system. Track, manage, and optimize your maritime assets.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: Ship, text: "Real-time vessel tracking" },
              { icon: Waves, text: "Voyage planning & optimization" },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white/80">
                <div className="p-2 bg-white/10 rounded-lg">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Anchor className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">VesselMS</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Bienvenue</h2>
            <p className="text-muted-foreground mt-2">
              Sélectionnez votre rôle et connectez-vous à votre compte
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Connexion</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto font-normal text-xs text-primary hover:text-primary/80"
                    >
                      Mot de passe oublié?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Entrez votre mot de passe"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, rememberMe: checked as boolean })
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-muted-foreground cursor-pointer"
                  >
                    Se souvenir de moi pendant 30 jours
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isLoading || !formData.email || !formData.password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              {/* Demo Accounts */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Comptes de démo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <Button
                    key={account.id}
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    disabled={isLoading}
                    onClick={() => handleDemoLogin(account)}
                  >
                    <account.icon className="mr-1.5 h-3.5 w-3.5" />
                    {account.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas de compte?{" "}
            <Button variant="link" className="px-1 h-auto font-semibold text-primary">
              Contacter l&apos;administrateur
            </Button>
          </p>

          <p className="text-center text-xs text-muted-foreground/60">
            En vous connectant, vous acceptez nos{" "}
            <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground/60 hover:text-primary">
              Conditions d&apos;utilisation
            </Button>{" "}
            et notre{" "}
            <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground/60 hover:text-primary">
              Politique de confidentialité
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
