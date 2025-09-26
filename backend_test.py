import requests
import sys
import json
from datetime import datetime

class UniversitySchedulingAPITester:
    def __init__(self, base_url="https://unischedule-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'faculty': [],
            'subjects': [],
            'classrooms': [],
            'batches': [],
            'announcements': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Created resource ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (30s)")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test authentication for all roles"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        roles = [
            {'role': 'admin', 'email': 'admin@university.edu'},
            {'role': 'lecturer', 'email': 'lecturer@university.edu'},
            {'role': 'student', 'email': 'student@university.edu'}
        ]
        
        auth_success = True
        for role_data in roles:
            success, response = self.run_test(
                f"Login as {role_data['role']}",
                "POST",
                "auth/login",
                200,
                data=role_data
            )
            if success and 'user' in response:
                print(f"   User: {response['user']['name']} ({response['user']['role']})")
                if role_data['role'] == 'admin':
                    self.token = response.get('token')
            else:
                auth_success = False
        
        return auth_success

    def test_sample_data_initialization(self):
        """Test sample data initialization"""
        print("\n" + "="*50)
        print("TESTING SAMPLE DATA INITIALIZATION")
        print("="*50)
        
        success, response = self.run_test(
            "Initialize Sample Data",
            "POST",
            "init-sample-data",
            200
        )
        
        if success:
            print(f"   Message: {response.get('message', 'Success')}")
        
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            stats = response
            print(f"   Faculty: {stats.get('total_faculty', 0)}")
            print(f"   Students: {stats.get('total_students', 0)}")
            print(f"   Subjects: {stats.get('total_subjects', 0)}")
            print(f"   Classrooms: {stats.get('total_classrooms', 0)}")
            print(f"   Batches: {stats.get('total_batches', 0)}")
        
        return success

    def test_faculty_management(self):
        """Test faculty CRUD operations"""
        print("\n" + "="*50)
        print("TESTING FACULTY MANAGEMENT")
        print("="*50)
        
        # Get existing faculty
        success, faculty_list = self.run_test(
            "Get Faculty List",
            "GET",
            "faculty",
            200
        )
        
        if not success:
            return False
        
        print(f"   Found {len(faculty_list)} faculty members")
        
        # Create new faculty
        new_faculty = {
            "name": "Dr. Test Faculty",
            "email": "test.faculty@university.edu",
            "department": "CSE",
            "subjects": ["Test Subject 1", "Test Subject 2"]
        }
        
        success, created_faculty = self.run_test(
            "Create Faculty",
            "POST",
            "faculty",
            200,
            data=new_faculty
        )
        
        if success and 'id' in created_faculty:
            faculty_id = created_faculty['id']
            self.created_resources['faculty'].append(faculty_id)
            
            # Get specific faculty
            success, _ = self.run_test(
                "Get Faculty by ID",
                "GET",
                f"faculty/{faculty_id}",
                200
            )
            
            # Update faculty
            updated_faculty = {
                "name": "Dr. Updated Test Faculty",
                "email": "updated.faculty@university.edu",
                "department": "ECE",
                "subjects": ["Updated Subject"]
            }
            
            success, _ = self.run_test(
                "Update Faculty",
                "PUT",
                f"faculty/{faculty_id}",
                200,
                data=updated_faculty
            )
            
            # Delete faculty
            success, _ = self.run_test(
                "Delete Faculty",
                "DELETE",
                f"faculty/{faculty_id}",
                200
            )
            
            if success:
                self.created_resources['faculty'].remove(faculty_id)
        
        return True

    def test_subject_management(self):
        """Test subject CRUD operations"""
        print("\n" + "="*50)
        print("TESTING SUBJECT MANAGEMENT")
        print("="*50)
        
        # Get existing subjects
        success, subjects_list = self.run_test(
            "Get Subjects List",
            "GET",
            "subjects",
            200
        )
        
        if not success:
            return False
        
        print(f"   Found {len(subjects_list)} subjects")
        
        # Create new subject
        new_subject = {
            "name": "Test Subject",
            "code": "TEST101",
            "department": "CSE",
            "year": 1,
            "semester": 1,
            "type": "theory",
            "hours_per_week": 4
        }
        
        success, created_subject = self.run_test(
            "Create Subject",
            "POST",
            "subjects",
            200,
            data=new_subject
        )
        
        if success and 'id' in created_subject:
            subject_id = created_subject['id']
            self.created_resources['subjects'].append(subject_id)
            
            # Get subjects by criteria
            success, _ = self.run_test(
                "Get Subjects by Department/Year/Semester",
                "GET",
                "subjects/CSE/1/1",
                200
            )
        
        return True

    def test_classroom_management(self):
        """Test classroom CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CLASSROOM MANAGEMENT")
        print("="*50)
        
        # Get existing classrooms
        success, classrooms_list = self.run_test(
            "Get Classrooms List",
            "GET",
            "classrooms",
            200
        )
        
        if not success:
            return False
        
        print(f"   Found {len(classrooms_list)} classrooms")
        
        # Create new classroom
        new_classroom = {
            "name": "TEST-101",
            "capacity": 50,
            "type": "lecture_hall",
            "equipment": ["Projector", "Audio System"]
        }
        
        success, created_classroom = self.run_test(
            "Create Classroom",
            "POST",
            "classrooms",
            200,
            data=new_classroom
        )
        
        if success and 'id' in created_classroom:
            classroom_id = created_classroom['id']
            self.created_resources['classrooms'].append(classroom_id)
        
        return True

    def test_batch_management(self):
        """Test student batch CRUD operations"""
        print("\n" + "="*50)
        print("TESTING BATCH MANAGEMENT")
        print("="*50)
        
        # Get existing batches
        success, batches_list = self.run_test(
            "Get Batches List",
            "GET",
            "batches",
            200
        )
        
        if not success:
            return False
        
        print(f"   Found {len(batches_list)} batches")
        
        # Create new batch
        new_batch = {
            "name": "TEST-1A",
            "department": "CSE",
            "year": 1,
            "semester": 1,
            "student_count": 30
        }
        
        success, created_batch = self.run_test(
            "Create Batch",
            "POST",
            "batches",
            200,
            data=new_batch
        )
        
        if success and 'id' in created_batch:
            batch_id = created_batch['id']
            self.created_resources['batches'].append(batch_id)
        
        return True

    def test_timetable_generation(self):
        """Test AI-powered timetable generation"""
        print("\n" + "="*50)
        print("TESTING AI TIMETABLE GENERATION")
        print("="*50)
        
        # Get available batches first
        success, batches = self.run_test(
            "Get Batches for Timetable",
            "GET",
            "batches",
            200
        )
        
        if not success or not batches:
            print("   No batches available for timetable generation")
            return False
        
        # Use first few batches for timetable generation
        batch_ids = [batch['id'] for batch in batches[:2]]  # Limit to 2 batches for testing
        
        timetable_request = {
            "batch_ids": batch_ids,
            "constraints": {
                "start_time": "09:00",
                "end_time": "17:00",
                "period_duration": 60,
                "break_duration": 15,
                "lunch_break_start": "12:00",
                "lunch_break_duration": 60,
                "max_hours_per_day": 6,
                "no_back_to_back_labs": True,
                "max_consecutive_hours": 3
            }
        }
        
        print(f"   Generating timetable for {len(batch_ids)} batches...")
        print("   This may take 10-30 seconds due to AI processing...")
        
        success, response = self.run_test(
            "Generate AI Timetable",
            "POST",
            "timetable/generate",
            200,
            data=timetable_request
        )
        
        if success:
            if response.get('success'):
                timetable_entries = response.get('timetable', [])
                print(f"   Generated {len(timetable_entries)} timetable entries")
                
                # Test getting timetable for a batch
                if batch_ids:
                    success, batch_timetable = self.run_test(
                        "Get Batch Timetable",
                        "GET",
                        f"timetable/{batch_ids[0]}",
                        200
                    )
                    if success:
                        print(f"   Retrieved {len(batch_timetable)} entries for batch")
            else:
                print(f"   AI Generation failed: {response.get('message', 'Unknown error')}")
                return False
        
        return success

    def test_announcement_system(self):
        """Test announcement management"""
        print("\n" + "="*50)
        print("TESTING ANNOUNCEMENT SYSTEM")
        print("="*50)
        
        # Create announcement
        new_announcement = {
            "title": "Test Announcement",
            "message": "This is a test announcement for the university scheduling system.",
            "author": "Test Admin",
            "target_roles": ["student", "lecturer"]
        }
        
        success, created_announcement = self.run_test(
            "Create Announcement",
            "POST",
            "announcements",
            200,
            data=new_announcement
        )
        
        if success and 'id' in created_announcement:
            self.created_resources['announcements'].append(created_announcement['id'])
        
        # Get all announcements
        success, announcements = self.run_test(
            "Get All Announcements",
            "GET",
            "announcements",
            200
        )
        
        if success:
            print(f"   Found {len(announcements)} announcements")
        
        # Get announcements for specific role
        success, student_announcements = self.run_test(
            "Get Student Announcements",
            "GET",
            "announcements?role=student",
            200
        )
        
        if success:
            print(f"   Found {len(student_announcements)} student announcements")
        
        return True

    def test_absence_management(self):
        """Test absence reporting and substitute finding"""
        print("\n" + "="*50)
        print("TESTING ABSENCE MANAGEMENT")
        print("="*50)
        
        # Report absence
        new_absence = {
            "lecturer_id": "demo-lecturer-id",
            "date": "monday",
            "time_slot": "10:00-11:00",
            "reason": "Medical appointment"
        }
        
        success, created_absence = self.run_test(
            "Report Absence",
            "POST",
            "absences",
            200,
            data=new_absence
        )
        
        absence_id = None
        if success and 'id' in created_absence:
            absence_id = created_absence['id']
        
        # Get all absences
        success, absences = self.run_test(
            "Get All Absences",
            "GET",
            "absences",
            200
        )
        
        if success:
            print(f"   Found {len(absences)} absences")
        
        # Test substitute finding (this uses AI and may take time)
        if absence_id:
            print("   Testing AI substitute finding...")
            success, substitute_response = self.run_test(
                "Find Substitute",
                "POST",
                f"absences/{absence_id}/substitute",
                200
            )
            
            if success:
                if substitute_response.get('success'):
                    print("   Substitute found successfully")
                else:
                    print(f"   Substitute finding failed: {substitute_response.get('message')}")
        
        return True

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n" + "="*50)
        print("CLEANING UP TEST RESOURCES")
        print("="*50)
        
        # Delete created resources
        for resource_type, ids in self.created_resources.items():
            for resource_id in ids:
                endpoint_map = {
                    'faculty': 'faculty',
                    'subjects': 'subjects',
                    'classrooms': 'classrooms',
                    'batches': 'batches'
                }
                
                if resource_type in endpoint_map:
                    self.run_test(
                        f"Delete {resource_type} {resource_id}",
                        "DELETE",
                        f"{endpoint_map[resource_type]}/{resource_id}",
                        200
                    )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting University Scheduling Platform API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        
        try:
            # Test authentication first
            if not self.test_authentication():
                print("\n❌ Authentication tests failed. Stopping.")
                return False
            
            # Initialize sample data
            self.test_sample_data_initialization()
            
            # Test dashboard stats
            self.test_dashboard_stats()
            
            # Test CRUD operations
            self.test_faculty_management()
            self.test_subject_management()
            self.test_classroom_management()
            self.test_batch_management()
            
            # Test core AI features
            self.test_timetable_generation()
            
            # Test communication features
            self.test_announcement_system()
            self.test_absence_management()
            
            # Clean up
            self.cleanup_resources()
            
            return True
            
        except Exception as e:
            print(f"\n💥 Unexpected error during testing: {str(e)}")
            return False

    def print_results(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! The API is working correctly.")
            return True
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} tests failed. Please check the issues above.")
            return False

def main():
    tester = UniversitySchedulingAPITester()
    
    success = tester.run_all_tests()
    final_success = tester.print_results()
    
    return 0 if final_success else 1

if __name__ == "__main__":
    sys.exit(main())