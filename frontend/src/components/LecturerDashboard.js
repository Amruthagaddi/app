import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  LogOut, 
  Plus, 
  GraduationCap,
  Megaphone,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const LecturerDashboard = ({ user, onLogout }) => {
  const [timetable, setTimetable] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Absence form
  const [absenceForm, setAbsenceForm] = useState({
    date: '',
    time_slot: '',
    reason: ''
  });

  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Note: In a real app, we'd get the actual lecturer ID from authentication
      const lecturerId = user.id || 'demo-lecturer-id';
      
      const [timetableRes, announcementsRes, absencesRes] = await Promise.all([
        axios.get(`/timetable/faculty/${lecturerId}`),
        axios.get('/announcements?role=lecturer'),
        axios.get('/absences')
      ]);

      setTimetable(timetableRes.data);
      setAnnouncements(announcementsRes.data);
      setAbsences(absencesRes.data.filter(absence => absence.lecturer_id === lecturerId));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // For demo purposes, show empty data instead of error
      setTimetable([]);
      setAnnouncements([]);
      setAbsences([]);
    }
  };

  const reportAbsence = async () => {
    if (!absenceForm.date || !absenceForm.time_slot || !absenceForm.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/absences', {
        ...absenceForm,
        lecturer_id: user.id || 'demo-lecturer-id'
      });
      
      toast.success('Absence reported successfully!');
      setAbsenceForm({ date: '', time_slot: '', reason: '' });
      loadDashboardData();
    } catch (error) {
      console.error('Error reporting absence:', error);
      toast.error('Failed to report absence');
    } finally {
      setLoading(false);
    }
  };

  // Group timetable by day for better display
  const groupedTimetable = days.reduce((acc, day) => {
    acc[day] = timetable.filter(entry => 
      entry.day.toLowerCase() === day.toLowerCase()
    ).sort((a, b) => a.time_slot.localeCompare(b.time_slot));
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lecturer Portal</h1>
                <p className="text-sm text-gray-500">Manage your classes and schedule</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                {user.department && (
                  <p className="text-xs text-gray-500">{user.department} Department</p>
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
          <p className="text-gray-600">Here's your teaching schedule and recent updates.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Weekly Timetable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>My Teaching Schedule</span>
                </CardTitle>
                <CardDescription>
                  Your weekly class timetable
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timetable.length > 0 ? (
                  <div className="space-y-4">
                    {days.map(day => (
                      <div key={day} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">{day}</h4>
                        {groupedTimetable[day]?.length > 0 ? (
                          <div className="grid gap-3">
                            {groupedTimetable[day].map((entry, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {entry.subject_name} ({entry.subject_code})
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {entry.batch_name} • {entry.classroom_name}
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                  {entry.time_slot}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No classes scheduled</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No timetable available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your timetable will appear here once generated by admin
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Absences */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>My Absences</span>
                  </CardTitle>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button data-testid="report-absence-btn" className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Report Absence</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report Absence</DialogTitle>
                        <DialogDescription>
                          Report your absence for a specific class
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="absence-date">Date</Label>
                          <Input
                            id="absence-date"
                            data-testid="absence-date-input"
                            type="date"
                            value={absenceForm.date}
                            onChange={(e) => setAbsenceForm({...absenceForm, date: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label htmlFor="absence-time">Time Slot</Label>
                          <Select value={absenceForm.time_slot} onValueChange={(value) => setAbsenceForm({...absenceForm, time_slot: value})}>
                            <SelectTrigger data-testid="absence-time-select">
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map(slot => (
                                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="absence-reason">Reason</Label>
                          <textarea
                            id="absence-reason"
                            data-testid="absence-reason-input"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            rows={3}
                            value={absenceForm.reason}
                            onChange={(e) => setAbsenceForm({...absenceForm, reason: e.target.value})}
                            placeholder="Reason for absence..."
                          />
                        </div>
                        <Button 
                          onClick={reportAbsence} 
                          data-testid="submit-absence-btn"
                          disabled={loading} 
                          className="w-full"
                        >
                          {loading ? 'Reporting...' : 'Report Absence'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {absences.length > 0 ? (
                    absences.map((absence) => (
                      <div key={absence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {absence.date} - {absence.time_slot}
                          </p>
                          <p className="text-sm text-gray-600">{absence.reason}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {absence.status === 'pending' && (
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Pending</span>
                            </Badge>
                          )}
                          {absence.status === 'approved' && (
                            <Badge variant="default" className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Approved</span>
                            </Badge>
                          )}
                          {absence.status === 'substituted' && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>Substituted</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No absences reported</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600 capitalize">{user.role}</p>
                  {user.department && (
                    <Badge variant="outline" className="mt-2">
                      {user.department} Department
                    </Badge>
                  )}
                  {user.subjects && user.subjects.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Teaching Subjects:</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {user.subjects.map((subject, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{timetable.length}</p>
                  <p className="text-sm text-gray-600">Classes/Week</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{absences.length}</p>
                  <p className="text-sm text-gray-600">Absences</p>
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

            {/* Today's Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Today's Classes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                  const todayClasses = groupedTimetable[today] || [];
                  
                  return todayClasses.length > 0 ? (
                    <div className="space-y-2">
                      {todayClasses.map((entry, index) => (
                        <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                          <p className="font-medium text-sm text-gray-900">
                            {entry.subject_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {entry.time_slot} • {entry.classroom_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500 text-sm">No classes today</p>
                    </div>
                  );
                })()
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
