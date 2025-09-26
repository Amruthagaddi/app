import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  LogOut, 
  GraduationCap,
  Megaphone,
  Clock,
  MapPin,
  User
} from 'lucide-react';
import axios from 'axios';

const StudentDashboard = ({ user, onLogout }) => {
  const [timetable, setTimetable] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // For demo purposes, we'll try to get a batch timetable
      // In real implementation, we'd get student's batch from their profile
      const batchId = user.batch_id || 'demo-batch-id';
      
      const [announcementsRes] = await Promise.all([
        axios.get('/announcements?role=student')
      ]);

      // Try to get timetable, but handle gracefully if not available
      try {
        const timetableRes = await axios.get(`/timetable/${batchId}`);
        setTimetable(timetableRes.data);
      } catch (error) {
        console.log('No timetable data available');
        setTimetable([]);
      }

      setAnnouncements(announcementsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setTimetable([]);
      setAnnouncements([]);
      setLoading(false);
    }
  };

  // Group timetable by day and time for grid display
  const createTimetableGrid = () => {
    const grid = {};
    
    days.forEach(day => {
      grid[day] = {};
      timeSlots.forEach(slot => {
        grid[day][slot] = null;
      });
    });

    timetable.forEach(entry => {
      const day = entry.day.charAt(0).toUpperCase() + entry.day.slice(1).toLowerCase();
      if (grid[day] && grid[day][entry.time_slot] !== undefined) {
        grid[day][entry.time_slot] = entry;
      }
    });

    return grid;
  };

  const timetableGrid = createTimetableGrid();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-500">Your academic dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                {user.batch && (
                  <p className="text-xs text-gray-500">{user.batch}</p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                data-testid="logout-button"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">Check your class schedule and stay updated with announcements.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Weekly Timetable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>My Class Schedule</span>
                </CardTitle>
                <CardDescription>
                  Your weekly class timetable
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timetable.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Timetable Grid */}
                      <div className="grid grid-cols-8 gap-1 bg-gray-100 p-2 rounded-lg">
                        {/* Header */}
                        <div className="bg-white p-3 rounded font-semibold text-center text-sm">
                          Time \\ Day
                        </div>
                        {days.map(day => (
                          <div key={day} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded font-semibold text-center text-sm">
                            {day.slice(0, 3)}
                          </div>
                        ))}
                        
                        {/* Time slots and classes */}
                        {timeSlots.map(slot => (
                          <React.Fragment key={slot}>
                            <div className="bg-gray-200 p-3 rounded font-medium text-center text-sm flex items-center justify-center">
                              {slot}
                            </div>
                            {days.map(day => {
                              const entry = timetableGrid[day][slot];
                              return (
                                <div key={`${day}-${slot}`} className={`p-2 rounded min-h-20 flex flex-col justify-center ${
                                  entry 
                                    ? entry.subject_name?.toLowerCase().includes('lab') 
                                      ? 'bg-gradient-to-br from-orange-100 to-orange-200 border-l-4 border-orange-500'
                                      : 'bg-gradient-to-br from-green-100 to-green-200 border-l-4 border-green-500'
                                    : 'bg-white'
                                }`}>
                                  {entry ? (
                                    <div className="text-center">
                                      <p className="font-medium text-xs text-gray-900 mb-1">
                                        {entry.subject_name}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {entry.subject_code}
                                      </p>
                                      <div className="flex items-center justify-center mt-1">
                                        <MapPin className="w-3 h-3 text-gray-500 mr-1" />
                                        <span className="text-xs text-gray-500">
                                          {entry.classroom_name}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-center mt-1">
                                        <User className="w-3 h-3 text-gray-500 mr-1" />
                                        <span className="text-xs text-gray-500">
                                          {entry.faculty_name}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center text-gray-400 text-xs">
                                      Free
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg font-medium">No timetable available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your class schedule will appear here once generated
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Today's Classes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                  const todayClasses = timetable.filter(entry => 
                    entry.day.toLowerCase() === today.toLowerCase()
                  ).sort((a, b) => a.time_slot.localeCompare(b.time_slot));
                  
                  return todayClasses.length > 0 ? (
                    <div className="space-y-3">
                      {todayClasses.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {entry.subject_name} ({entry.subject_code})
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{entry.classroom_name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{entry.faculty_name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            {entry.time_slot}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No classes scheduled for today</p>
                      <p className="text-sm text-gray-400 mt-1">Enjoy your day off!</p>
                    </div>
                  );
                })()
                }
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600 capitalize">{user.role}</p>
                  {user.department && (
                    <Badge variant="outline" className="mt-2">
                      {user.department} Department
                    </Badge>
                  )}
                  {user.batch && (
                    <Badge variant="secondary" className="mt-2 ml-2">
                      {user.batch}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{timetable.length}</p>
                  <p className="text-sm text-gray-600">Classes This Week</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                      return timetable.filter(entry => 
                        entry.day.toLowerCase() === today.toLowerCase()
                      ).length;
                    })()
                    }
                  </p>
                  <p className="text-sm text-gray-600">Classes Today</p>
                </CardContent>
              </Card>
            </div>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Megaphone className="w-5 h-5" />
                  <span>Announcements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-medium text-gray-900 text-sm">{announcement.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{announcement.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(announcement.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Megaphone className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500 text-sm">No announcements</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-green-100 to-green-200 border-l-2 border-green-500 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Theory Class</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-orange-100 to-orange-200 border-l-2 border-orange-500 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Lab Session</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white border border-gray-200 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Free Period</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
