import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Store, Clock, MapPin, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function CustomerAuth() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('login');
  const [accountType, setAccountType] = useState('customer');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (form: any, isLogin: boolean) => {
    const newErrors: Record<string, string> = {};

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!form.username) {
        newErrors.username = 'Name is required';
      }
      if (!form.phoneNumber) {
        newErrors.phoneNumber = 'Phone number is required for notifications';
      } else if (!/^\+?[\d\s\-\(\)]+$/.test(form.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(loginForm, true)) return;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: loginForm.email, // Backend expects username field
          password: loginForm.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const user = await response.json();
      
      // Set session marker and update auth state
      localStorage.setItem("auth_session_active", "true");
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      // Redirect based on user role
      if (user.role === 'owner') {
        setLocation('/dashboard');
      } else {
        setLocation('/restaurants');
      }
      
      // Refresh the page to update auth state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(registerForm, false)) return;

    try {
      const userData = {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        phoneNumber: registerForm.phoneNumber,
        role: accountType as 'customer' | 'owner'
      };

      // Since there's no register endpoint, let's use the auth system
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const user = await response.json();
      
      // Set session marker
      localStorage.setItem("auth_session_active", "true");
      
      toast({
        title: "Welcome to TableQueue!",
        description: "Your account has been created successfully.",
      });

      // Redirect based on account type
      if (accountType === 'owner') {
        setLocation('/dashboard');
      } else {
        setLocation('/restaurants');
      }
      
      // Refresh the page to update auth state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-purple-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="text-center lg:text-left text-white space-y-8">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              Never Wait in Line Again
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
              TableQueue helps you discover restaurants with the shortest wait times and allows restaurant owners to manage their waitlists efficiently.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Real-time Wait Times</h3>
                <p className="text-white/80">Get accurate wait time information before you arrive at the restaurant.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Google Maps Integration</h3>
                <p className="text-white/80">Find restaurants near you and view their current wait status.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Notifications</h3>
                <p className="text-white/80">Receive updates when your table is almost ready.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to TableQueue</CardTitle>
              <CardDescription>
                Join thousands of users who never wait in line
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="john@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className={errors.password ? 'border-red-500' : ''}
                      />
                      {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Full Name</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="John Doe"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                        className={errors.username ? 'border-red-500' : ''}
                      />
                      {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="john@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        className={errors.password ? 'border-red-500' : ''}
                      />
                      {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={registerForm.phoneNumber}
                        onChange={(e) => setRegisterForm({...registerForm, phoneNumber: e.target.value})}
                        className={errors.phoneNumber ? 'border-red-500' : ''}
                      />
                      {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
                      <p className="text-xs text-gray-500">We'll use this for waitlist notifications and important updates</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Account Type</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            accountType === 'customer' 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setAccountType('customer')}
                        >
                          <div className="text-center">
                            <User className="h-8 w-8 mx-auto mb-2 text-red-500" />
                            <h3 className="font-medium">Customer</h3>
                            <p className="text-xs text-gray-500 mt-1">Find restaurants and join waitlists</p>
                          </div>
                        </div>

                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            accountType === 'owner' 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setAccountType('owner')}
                        >
                          <div className="text-center">
                            <Store className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                            <h3 className="font-medium">Restaurant Owner</h3>
                            <p className="text-xs text-gray-500 mt-1">Manage your restaurant waitlist</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}