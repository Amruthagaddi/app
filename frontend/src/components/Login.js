import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { GraduationCap, Users, BookOpen, Building2 } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.role) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/login', formData);
      if (response.data.success) {
        toast.success('Login successful!');
        onLogin(response.data.user);
      } else {
        toast.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleIcons = {
    admin: Building2,
    lecturer: Users,
    student: BookOpen
  };

  const demoCredentials = [
    { role: 'admin', email: 'admin@university.edu', label: 'Administrator' },
    { role: 'lecturer', email: 'lecturer@university.edu', label: 'Lecturer' },
    { role: 'student', email: 'student@university.edu', label: 'Student' }
  ];

  const fillDemoCredentials = (role, email) => {
    setFormData({ role, email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1590579491624-f98f36d4c763?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzfGVufDB8fHx8MTc1ODkxMTY2NXww&ixlib=rb-4.1.0&q=85"
          alt="University Campus"
          className="w-full h-full object-cover opacity-10"
        />
      </div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Welcome Content */}
        <div className="text-center lg:text-left space-y-6 px-8">
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              UniSchedule
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Adaptive University
              <span className="block text-indigo-600">Class Scheduling</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Intelligent scheduling platform for modern universities. Streamline your academic operations with AI-powered timetable generation.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl">
              <Building2 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Smart Scheduling</p>
            </div>
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl">
              <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Faculty Management</p>
            </div>
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl">
              <BookOpen className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Real-time Updates</p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your university dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="email-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger data-testid="role-select" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  data-testid="login-button"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              
              {/* Demo Credentials */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-4">Quick Demo Access:</p>
                <div className="grid gap-2">
                  {demoCredentials.map((cred) => {
                    const IconComponent = roleIcons[cred.role];
                    return (
                      <button
                        key={cred.role}
                        data-testid={`demo-${cred.role}-btn`}
                        onClick={() => fillDemoCredentials(cred.role, cred.email)}
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-700">{cred.label}</span>
                        </div>
                        <span className="text-xs text-gray-500">{cred.email}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
