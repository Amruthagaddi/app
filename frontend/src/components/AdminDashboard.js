import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Building2, 
  Calendar, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  GraduationCap,
  Clock,
  UserCheck,
  Megaphone,
  BarChart3,
  Brain
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timetableGenLoading, setTimetableGenLoading] = useState(false);

  // Form states
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', department: '', subjects: [] });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', department: '', year: 1, semester: 1, type: 'theory', hours_per_week: 4 });
  const [classroomForm, setClassroomForm] = useState({ name: '', capacity: 60, type: 'lecture_hall', equipment: [] });
  const [batchForm, setBatchForm] = useState({ name: '', department: '', year: 1, semester: 1, student_count: 60 });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', target_roles: [] });
  const [timetableConstraints, setTimetableConstraints] = useState({
    start_time: '09:00',
    end_time: '17:00',
    period_duration: 60,
    break_duration: 15,
    lunch_break_start: '12:00',
    lunch_break_duration: 60,
    max_hours_per_day: 6,
    no_back_to_back_labs: true,
    max_consecutive_hours: 3
  });

  const departments = ['CSE', 'ISE', 'ECE', 'ME', 'CE'];
  const subjectTypes = ['theory', 'lab'];
  const classroomTypes = ['lecture_hall', 'lab', 'seminar_room'];
  const roles = ['admin', 'lecturer', 'student'];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, facultyRes, subjectsRes, classroomsRes, batchesRes, announcementsRes, absencesRes] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/faculty'),
        axios.get('/subjects'),
        axios.get('/classrooms'),
        axios.get('/batches'),
        axios.get('/announcements'),
        axios.get('/absences')
      ]);

      setStats(statsRes.data);
      setFaculty(facultyRes.data);
      setSubjects(subjectsRes.data);
      setClassrooms(classroomsRes.data);
      setBatches(batchesRes.data);
      setAnnouncements(announcementsRes.data);
      setAbsences(absencesRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const initializeSampleData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/init-sample-data');
      if (response.data.success) {
        toast.success('Sample data initialized successfully!');
        loadDashboardData();
      } else {
        toast.error('Failed to initialize sample data');
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
      toast.error('Failed to initialize sample data');
    } finally {
      setLoading(false);
    }
  };

  const generateTimetable = async () => {
    if (batches.length === 0) {
      toast.error('No batches available. Please create batches first.');
      return;
    }

    setTimetableGenLoading(true);
    try {
      const batchIds = batches.map(batch => batch.id);
      const response = await axios.post('/timetable/generate', {
        batch_ids: batchIds,
        constraints: timetableConstraints
      });

      if (response.data.success) {
        toast.success(`Timetable generated successfully! ${response.data.timetable.length} entries created.`);
      } else {
        toast.error(response.data.message || 'Failed to generate timetable');
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      toast.error('Failed to generate timetable');
    } finally {
      setTimetableGenLoading(false);
    }
  };

  const createFaculty = async () => {
    if (!facultyForm.name || !facultyForm.email || !facultyForm.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('/faculty', facultyForm);
      toast.success('Faculty created successfully!');
      setFacultyForm({ name: '', email: '', department: '', subjects: [] });
      loadDashboardData();
    } catch (error) {
      console.error('Error creating faculty:', error);
      toast.error('Failed to create faculty');
    }
  };

  const createSubject = async () => {
    if (!subjectForm.name || !subjectForm.code || !subjectForm.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('/subjects', subjectForm);
      toast.success('Subject created successfully!');
      setSubjectForm({ name: '', code: '', department: '', year: 1, semester: 1, type: 'theory', hours_per_week: 4 });
      loadDashboardData();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    }
  };

  const createClassroom = async () => {
    if (!classroomForm.name || !classroomForm.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('/classrooms', classroomForm);
      toast.success('Classroom created successfully!');
      setClassroomForm({ name: '', capacity: 60, type: 'lecture_hall', equipment: [] });
      loadDashboardData();
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error('Failed to create classroom');
    }
  };

  const createBatch = async () => {
    if (!batchForm.name || !batchForm.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('/batches', batchForm);
      toast.success('Batch created successfully!');
      setBatchForm({ name: '', department: '', year: 1, semester: 1, student_count: 60 });
      loadDashboardData();
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
    }
  };

  const createAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message || announcementForm.target_roles.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('/announcements', {
        ...announcementForm,
        author: user.name
      });
      toast.success('Announcement created successfully!');
      setAnnouncementForm({ title: '', message: '', target_roles: [] });
      loadDashboardData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const deleteItem = async (endpoint, id, itemName) => {
    if (!window.confirm(`Are you sure you want to delete this ${itemName}?`)) return;

    try {
      await axios.delete(`/${endpoint}/${id}`);
      toast.success(`${itemName} deleted successfully!`);
      loadDashboardData();
    } catch (error) {
      console.error(`Error deleting ${itemName}:`, error);
      toast.error(`Failed to delete ${itemName}`);
    }
  };

  const findSubstitute = async (absenceId) => {
    setLoading(true);
    try {
      const response = await axios.post(`/absences/${absenceId}/substitute`);
      if (response.data.success) {
        toast.success('Substitute found successfully!');
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to find substitute');
      }
    } catch (error) {
      console.error('Error finding substitute:', error);
      toast.error('Failed to find substitute');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">UniSchedule Admin</h1>
                <p className="text-sm text-gray-500">Intelligent University Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="faculty" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Faculty</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Subjects</span>
            </TabsTrigger>
            <TabsTrigger value="classrooms" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Classrooms</span>
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Batches</span>
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Timetable</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Manage</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
                <p className="text-gray-600">Overview of university operations</p>
              </div>
              <Button 
                onClick={initializeSampleData} 
                disabled={loading}
                data-testid="init-sample-data-btn"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? 'Initializing...' : 'Initialize Sample Data'}
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Faculty" 
                value={stats.total_faculty || 0} 
                icon={Users} 
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                description="Active faculty members"
              />
              <StatCard 
                title="Total Students" 
                value={stats.total_students || 0} 
                icon={GraduationCap} 
                color="bg-gradient-to-br from-green-500 to-green-600"
                description="Enrolled students"
              />
              <StatCard 
                title="Total Subjects" 
                value={stats.total_subjects || 0} 
                icon={BookOpen} 
                color="bg-gradient-to-br from-purple-500 to-purple-600"
                description="Available subjects"
              />
              <StatCard 
                title="Classrooms" 
                value={stats.total_classrooms || 0} 
                icon={Building2} 
                color="bg-gradient-to-br from-orange-500 to-orange-600"
                description="Available classrooms"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Megaphone className="w-5 h-5" />
                    <span>Recent Announcements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {announcements.slice(0, 5).map((announcement) => (
                      <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm text-gray-900">{announcement.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(announcement.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <p className="text-gray-500 text-center py-4 text-sm">No announcements yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Pending Absences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {absences.filter(absence => absence.status === 'pending').slice(0, 5).map((absence) => (
                      <div key={absence.id} className="p-3 bg-red-50 rounded-lg">
                        <p className="font-medium text-sm text-gray-900">
                          {absence.date} - {absence.time_slot}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{absence.reason}</p>
                      </div>
                    ))}
                    {absences.filter(absence => absence.status === 'pending').length === 0 && (
                      <p className="text-gray-500 text-center py-4 text-sm">No pending absences</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Faculty Tab */}
          <TabsContent value="faculty" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
                <p className="text-gray-600">Manage faculty members and their subjects</p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="add-faculty-btn" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Faculty</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Faculty Member</DialogTitle>
                    <DialogDescription>
                      Add a new faculty member to the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="faculty-name">Name</Label>
                      <Input
                        id="faculty-name"
                        data-testid="faculty-name-input"
                        value={facultyForm.name}
                        onChange={(e) => setFacultyForm({...facultyForm, name: e.target.value})}
                        placeholder="Faculty name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="faculty-email">Email</Label>
                      <Input
                        id="faculty-email"
                        data-testid="faculty-email-input"
                        type="email"
                        value={facultyForm.email}
                        onChange={(e) => setFacultyForm({...facultyForm, email: e.target.value})}
                        placeholder="faculty@university.edu"
                      />
                    </div>
                    <div>
                      <Label htmlFor="faculty-department">Department</Label>
                      <Select value={facultyForm.department} onValueChange={(value) => setFacultyForm({...facultyForm, department: value})}>
                        <SelectTrigger data-testid="faculty-department-select">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="faculty-subjects">Subjects (comma-separated)</Label>
                      <Input
                        id="faculty-subjects"
                        data-testid="faculty-subjects-input"
                        value={facultyForm.subjects.join(', ')}
                        onChange={(e) => setFacultyForm({...facultyForm, subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                        placeholder="Data Structures, Algorithms, Programming"
                      />
                    </div>
                    <Button onClick={createFaculty} data-testid="create-faculty-btn" className="w-full">
                      Add Faculty
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {faculty.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{member.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {member.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">{member.department}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {member.subjects.slice(0, 2).map((subject, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                              {member.subjects.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{member.subjects.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`delete-faculty-${member.id}`}
                                onClick={() => deleteItem('faculty', member.id, 'faculty member')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {faculty.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No faculty members found. Click "Add Faculty" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
                <p className="text-gray-600">Manage subjects for different departments and semesters</p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="add-subject-btn" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Subject</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Subject</DialogTitle>
                    <DialogDescription>
                      Add a new subject to the curriculum
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject-name">Subject Name</Label>
                      <Input
                        id="subject-name"
                        data-testid="subject-name-input"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                        placeholder="Data Structures"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject-code">Subject Code</Label>
                      <Input
                        id="subject-code"
                        data-testid="subject-code-input"
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                        placeholder="CSE201"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject-department">Department</Label>
                      <Select value={subjectForm.department} onValueChange={(value) => setSubjectForm({...subjectForm, department: value})}>
                        <SelectTrigger data-testid="subject-department-select">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject-type">Type</Label>
                      <Select value={subjectForm.type} onValueChange={(value) => setSubjectForm({...subjectForm, type: value})}>
                        <SelectTrigger data-testid="subject-type-select">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjectTypes.map(type => (
                            <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject-year">Year</Label>
                      <Select value={subjectForm.year.toString()} onValueChange={(value) => setSubjectForm({...subjectForm, year: parseInt(value)})}>
                        <SelectTrigger data-testid="subject-year-select">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map(year => (
                            <SelectItem key={year} value={year.toString()}>Year {year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject-semester">Semester</Label>
                      <Select value={subjectForm.semester.toString()} onValueChange={(value) => setSubjectForm({...subjectForm, semester: parseInt(value)})}>
                        <SelectTrigger data-testid="subject-semester-select">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2].map(sem => (
                            <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="subject-hours">Hours per Week</Label>
                      <Input
                        id="subject-hours"
                        data-testid="subject-hours-input"
                        type="number"
                        value={subjectForm.hours_per_week}
                        onChange={(e) => setSubjectForm({...subjectForm, hours_per_week: parseInt(e.target.value)})}
                        placeholder="4"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={createSubject} data-testid="create-subject-btn" className="w-full">
                        Add Subject
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours/Week</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subjects.map((subject) => (
                        <tr key={subject.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{subject.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {subject.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">{subject.department}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            Year {subject.year}, Sem {subject.semester}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={subject.type === 'lab' ? 'destructive' : 'secondary'}>
                              {subject.type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {subject.hours_per_week}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`delete-subject-${subject.id}`}
                              onClick={() => deleteItem('subjects', subject.id, 'subject')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {subjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No subjects found. Click "Add Subject" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classrooms Tab */}
          <TabsContent value="classrooms" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Classroom Management</h2>
                <p className="text-gray-600">Manage classrooms and their facilities</p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="add-classroom-btn" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Classroom</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Classroom</DialogTitle>
                    <DialogDescription>
                      Add a new classroom to the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="classroom-name">Room Name</Label>
                      <Input
                        id="classroom-name"
                        data-testid="classroom-name-input"
                        value={classroomForm.name}
                        onChange={(e) => setClassroomForm({...classroomForm, name: e.target.value})}
                        placeholder="LH-101"
                      />
                    </div>
                    <div>
                      <Label htmlFor="classroom-capacity">Capacity</Label>
                      <Input
                        id="classroom-capacity"
                        data-testid="classroom-capacity-input"
                        type="number"
                        value={classroomForm.capacity}
                        onChange={(e) => setClassroomForm({...classroomForm, capacity: parseInt(e.target.value)})}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="classroom-type">Type</Label>
                      <Select value={classroomForm.type} onValueChange={(value) => setClassroomForm({...classroomForm, type: value})}>
                        <SelectTrigger data-testid="classroom-type-select">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {classroomTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="classroom-equipment">Equipment (comma-separated)</Label>
                      <Input
                        id="classroom-equipment"
                        data-testid="classroom-equipment-input"
                        value={classroomForm.equipment.join(', ')}
                        onChange={(e) => setClassroomForm({...classroomForm, equipment: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                        placeholder="Projector, Audio System, AC"
                      />
                    </div>
                    <Button onClick={createClassroom} data-testid="create-classroom-btn" className="w-full">
                      Add Classroom
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{classroom.name}</CardTitle>
                        <CardDescription>
                          {classroom.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        data-testid={`delete-classroom-${classroom.id}`}
                        onClick={() => deleteItem('classrooms', classroom.id, 'classroom')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity:</span>
                        <Badge variant="secondary">{classroom.capacity} seats</Badge>
                      </div>
                      {classroom.equipment && classroom.equipment.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 block mb-2">Equipment:</span>
                          <div className="flex flex-wrap gap-1">
                            {classroom.equipment.map((item, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {classrooms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No classrooms found. Click "Add Classroom" to get started.</p>
              </div>
            )}
          </TabsContent>

          {/* Batches Tab */}
          <TabsContent value="batches" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Batch Management</h2>
                <p className="text-gray-600">Manage student batches for different departments</p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="add-batch-btn" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Batch</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Student Batch</DialogTitle>
                    <DialogDescription>
                      Create a new student batch
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="batch-name">Batch Name</Label>
                      <Input
                        id="batch-name"
                        data-testid="batch-name-input"
                        value={batchForm.name}
                        onChange={(e) => setBatchForm({...batchForm, name: e.target.value})}
                        placeholder="CSE-4A"
                      />
                    </div>
                    <div>
                      <Label htmlFor="batch-department">Department</Label>
                      <Select value={batchForm.department} onValueChange={(value) => setBatchForm({...batchForm, department: value})}>
                        <SelectTrigger data-testid="batch-department-select">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="batch-year">Year</Label>
                        <Select value={batchForm.year.toString()} onValueChange={(value) => setBatchForm({...batchForm, year: parseInt(value)})}>
                          <SelectTrigger data-testid="batch-year-select">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4].map(year => (
                              <SelectItem key={year} value={year.toString()}>Year {year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="batch-semester">Semester</Label>
                        <Select value={batchForm.semester.toString()} onValueChange={(value) => setBatchForm({...batchForm, semester: parseInt(value)})}>
                          <SelectTrigger data-testid="batch-semester-select">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2].map(sem => (
                              <SelectItem key={sem} value={sem.toString()}>Sem {sem}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="batch-count">Student Count</Label>
                      <Input
                        id="batch-count"
                        data-testid="batch-count-input"
                        type="number"
                        value={batchForm.student_count}
                        onChange={(e) => setBatchForm({...batchForm, student_count: parseInt(e.target.value)})}
                        placeholder="60"
                      />
                    </div>
                    <Button onClick={createBatch} data-testid="create-batch-btn" className="w-full">
                      Add Batch
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch) => (
                <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{batch.name}</CardTitle>
                        <CardDescription>{batch.department} Department</CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        data-testid={`delete-batch-${batch.id}`}
                        onClick={() => deleteItem('batches', batch.id, 'batch')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Academic:</span>
                        <Badge variant="secondary">Year {batch.year}, Sem {batch.semester}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Students:</span>
                        <Badge variant="outline">{batch.student_count} students</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {batches.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No student batches found. Click "Add Batch" to get started.</p>
              </div>
            )}
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Timetable Generation</h2>
                <p className="text-gray-600">Generate optimized timetables using artificial intelligence</p>
              </div>
              
              <Button 
                onClick={generateTimetable} 
                disabled={timetableGenLoading || batches.length === 0}
                data-testid="generate-timetable-btn"
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Brain className="w-4 h-4" />
                <span>{timetableGenLoading ? 'Generating...' : 'Generate AI Timetable'}</span>
              </Button>
            </div>

            {/* Timetable Constraints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Timetable Constraints</span>
                </CardTitle>
                <CardDescription>
                  Configure constraints for timetable generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      data-testid="start-time-input"
                      type="time"
                      value={timetableConstraints.start_time}
                      onChange={(e) => setTimetableConstraints({...timetableConstraints, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      data-testid="end-time-input"
                      type="time"
                      value={timetableConstraints.end_time}
                      onChange={(e) => setTimetableConstraints({...timetableConstraints, end_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="period-duration">Period Duration (minutes)</Label>
                    <Input
                      id="period-duration"
                      data-testid="period-duration-input"
                      type="number"
                      value={timetableConstraints.period_duration}
                      onChange={(e) => setTimetableConstraints({...timetableConstraints, period_duration: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-hours">Max Hours per Day</Label>
                    <Input
                      id="max-hours"
                      data-testid="max-hours-input"
                      type="number"
                      value={timetableConstraints.max_hours_per_day}
                      onChange={(e) => setTimetableConstraints({...timetableConstraints, max_hours_per_day: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lunch-start">Lunch Break Start</Label>
                    <Input
                      id="lunch-start"
                      data-testid="lunch-start-input"
                      type="time"
                      value={timetableConstraints.lunch_break_start}
                      onChange={(e) => setTimetableConstraints({...timetableConstraints, lunch_break_start: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lunch-duration">Lunch Duration (minutes)</Label>
                    <Input
                      id="lunch-duration"
                      data-testid="lunch-duration-input"
                      type="number"
                      value={timetableConstraints.lunch_break_duration}
                      onChange={(e) => setTimetableConstraints({...timetableConstraints, lunch_break_duration: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {timetableGenLoading && (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-900">Generating AI-Powered Timetable</p>
                    <p className="text-gray-600 mt-2">Please wait while our AI creates the optimal schedule...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {batches.length === 0 && (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No Batches Available</p>
                    <p className="mt-2">Please create student batches first to generate timetables.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">System Management</h2>
              <p className="text-gray-600">Manage announcements and handle absences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Announcements */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center space-x-2">
                      <Megaphone className="w-5 h-5" />
                      <span>Announcements</span>
                    </CardTitle>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="add-announcement-btn">
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Announcement</DialogTitle>
                          <DialogDescription>
                            Create a new announcement for the university
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="announcement-title">Title</Label>
                            <Input
                              id="announcement-title"
                              data-testid="announcement-title-input"
                              value={announcementForm.title}
                              onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                              placeholder="Announcement title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="announcement-message">Message</Label>
                            <textarea
                              id="announcement-message"
                              data-testid="announcement-message-input"
                              className="w-full p-3 border border-gray-300 rounded-lg"
                              rows={4}
                              value={announcementForm.message}
                              onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                              placeholder="Write your announcement here..."
                            />
                          </div>
                          <div>
                            <Label>Target Roles</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {roles.map(role => (
                                <label key={role} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    data-testid={`announcement-role-${role}`}
                                    checked={announcementForm.target_roles.includes(role)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAnnouncementForm({...announcementForm, target_roles: [...announcementForm.target_roles, role]});
                                      } else {
                                        setAnnouncementForm({...announcementForm, target_roles: announcementForm.target_roles.filter(r => r !== role)});
                                      }
                                    }}
                                  />
                                  <span className="text-sm capitalize">{role}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <Button onClick={createAnnouncement} data-testid="create-announcement-btn" className="w-full">
                            Create Announcement
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex space-x-1">
                            {announcement.target_roles.map(role => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(announcement.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No announcements yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Absences Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Absence Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {absences.map((absence) => (
                      <div key={absence.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {absence.date} - {absence.time_slot}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{absence.reason}</p>
                            <Badge 
                              variant={absence.status === 'pending' ? 'destructive' : 
                                     absence.status === 'approved' ? 'default' : 'secondary'}
                              className="mt-2"
                            >
                              {absence.status}
                            </Badge>
                          </div>
                          {absence.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => findSubstitute(absence.id)}
                              data-testid={`find-substitute-${absence.id}`}
                              disabled={loading}
                            >
                              Find Substitute
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {absences.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No absences reported</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
