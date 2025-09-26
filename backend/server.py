from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, time
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Integration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI(title="University Class Scheduling Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Data Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # admin, lecturer, student
    department: Optional[str] = None
    batch: Optional[str] = None  # for students
    subjects: Optional[List[str]] = []  # for lecturers
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str
    department: Optional[str] = None
    batch: Optional[str] = None
    subjects: Optional[List[str]] = []

class Faculty(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    department: str
    subjects: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FacultyCreate(BaseModel):
    name: str
    email: EmailStr
    department: str
    subjects: List[str]

class Classroom(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    capacity: int
    type: str  # lecture_hall, lab, seminar_room
    equipment: Optional[List[str]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClassroomCreate(BaseModel):
    name: str
    capacity: int
    type: str
    equipment: Optional[List[str]] = []

class Subject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    department: str
    year: int
    semester: int
    type: str  # theory, lab
    hours_per_week: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubjectCreate(BaseModel):
    name: str
    code: str
    department: str
    year: int
    semester: int
    type: str
    hours_per_week: int

class StudentBatch(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    department: str
    year: int
    semester: int
    student_count: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentBatchCreate(BaseModel):
    name: str
    department: str
    year: int
    semester: int
    student_count: int

class TimetableEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    batch_id: str
    subject_id: str
    faculty_id: str
    classroom_id: str
    day: str  # monday, tuesday, etc.
    time_slot: str  # "09:00-10:00"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TimetableGenRequest(BaseModel):
    batch_ids: List[str]
    constraints: Dict[str, Any]

class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    author: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    target_roles: List[str]  # admin, lecturer, student

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    author: str
    target_roles: List[str]

class Absence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lecturer_id: str
    date: str
    time_slot: str
    reason: str
    status: str = "pending"  # pending, approved, substituted
    substitute_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AbsenceCreate(BaseModel):
    lecturer_id: str
    date: str
    time_slot: str
    reason: str

class TimetableConstraints(BaseModel):
    start_time: str = "09:00"
    end_time: str = "17:00"
    period_duration: int = 60  # minutes
    break_duration: int = 15  # minutes
    lunch_break_start: str = "12:00"
    lunch_break_duration: int = 60  # minutes
    max_hours_per_day: int = 6
    no_back_to_back_labs: bool = True
    max_consecutive_hours: int = 3

# Authentication Routes
@api_router.post("/auth/login")
async def login(user_data: dict):
    """Mock authentication - in real app, integrate with Firebase"""
    email = user_data.get("email")
    role = user_data.get("role")
    
    # Mock user validation
    user = await db.users.find_one({"email": email, "role": role})
    if not user:
        # Create mock user if doesn't exist
        mock_user = User(
            email=email,
            name=f"Demo {role.title()}",
            role=role,
            department="CSE" if role != "admin" else None,
            batch="CSE-4A" if role == "student" else None,
            subjects=["Data Structures", "Algorithms"] if role == "lecturer" else []
        )
        await db.users.insert_one(mock_user.dict())
        user = mock_user.dict()
    
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "department": user.get("department"),
            "batch": user.get("batch")
        },
        "token": f"mock-token-{uuid.uuid4()}"
    }

# User Management
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.dict()
    user_obj = User(**user_dict)
    result = await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

# Faculty Management
@api_router.post("/faculty", response_model=Faculty)
async def create_faculty(faculty: FacultyCreate):
    faculty_dict = faculty.dict()
    faculty_obj = Faculty(**faculty_dict)
    await db.faculty.insert_one(faculty_obj.dict())
    return faculty_obj

@api_router.get("/faculty", response_model=List[Faculty])
async def get_faculty():
    faculty = await db.faculty.find().to_list(1000)
    return [Faculty(**f) for f in faculty]

@api_router.get("/faculty/{faculty_id}", response_model=Faculty)
async def get_faculty_by_id(faculty_id: str):
    faculty = await db.faculty.find_one({"id": faculty_id})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return Faculty(**faculty)

@api_router.put("/faculty/{faculty_id}", response_model=Faculty)
async def update_faculty(faculty_id: str, faculty_update: FacultyCreate):
    result = await db.faculty.update_one(
        {"id": faculty_id},
        {"$set": faculty_update.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
    updated_faculty = await db.faculty.find_one({"id": faculty_id})
    return Faculty(**updated_faculty)

@api_router.delete("/faculty/{faculty_id}")
async def delete_faculty(faculty_id: str):
    result = await db.faculty.delete_one({"id": faculty_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return {"message": "Faculty deleted successfully"}

# Classroom Management
@api_router.post("/classrooms", response_model=Classroom)
async def create_classroom(classroom: ClassroomCreate):
    classroom_dict = classroom.dict()
    classroom_obj = Classroom(**classroom_dict)
    await db.classrooms.insert_one(classroom_obj.dict())
    return classroom_obj

@api_router.get("/classrooms", response_model=List[Classroom])
async def get_classrooms():
    classrooms = await db.classrooms.find().to_list(1000)
    return [Classroom(**c) for c in classrooms]

@api_router.delete("/classrooms/{classroom_id}")
async def delete_classroom(classroom_id: str):
    result = await db.classrooms.delete_one({"id": classroom_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return {"message": "Classroom deleted successfully"}

# Subject Management
@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject: SubjectCreate):
    subject_dict = subject.dict()
    subject_obj = Subject(**subject_dict)
    await db.subjects.insert_one(subject_obj.dict())
    return subject_obj

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects():
    subjects = await db.subjects.find().to_list(1000)
    return [Subject(**s) for s in subjects]

@api_router.get("/subjects/{department}/{year}/{semester}")
async def get_subjects_by_criteria(department: str, year: int, semester: int):
    subjects = await db.subjects.find({
        "department": department,
        "year": year,
        "semester": semester
    }).to_list(1000)
    return [Subject(**s) for s in subjects]

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}

# Student Batch Management
@api_router.post("/batches", response_model=StudentBatch)
async def create_batch(batch: StudentBatchCreate):
    batch_dict = batch.dict()
    batch_obj = StudentBatch(**batch_dict)
    await db.batches.insert_one(batch_obj.dict())
    return batch_obj

@api_router.get("/batches", response_model=List[StudentBatch])
async def get_batches():
    batches = await db.batches.find().to_list(1000)
    return [StudentBatch(**b) for b in batches]

@api_router.delete("/batches/{batch_id}")
async def delete_batch(batch_id: str):
    result = await db.batches.delete_one({"id": batch_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"message": "Batch deleted successfully"}

# Timetable Generation with AI
@api_router.post("/timetable/generate")
async def generate_timetable(request: TimetableGenRequest):
    try:
        # Get data for timetable generation
        batches = await db.batches.find({"id": {"$in": request.batch_ids}}).to_list(1000)
        faculty = await db.faculty.find().to_list(1000)
        classrooms = await db.classrooms.find().to_list(1000)
        subjects = await db.subjects.find().to_list(1000)
        
        # Prepare data for AI
        timetable_data = {
            "batches": [StudentBatch(**b).dict() for b in batches],
            "faculty": [Faculty(**f).dict() for f in faculty],
            "classrooms": [Classroom(**c).dict() for c in classrooms],
            "subjects": [Subject(**s).dict() for s in subjects],
            "constraints": request.constraints
        }
        
        # Initialize LLM Chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"timetable-gen-{uuid.uuid4()}",
            system_message="You are an expert university timetable scheduler. Generate optimal timetables considering all constraints like faculty availability, classroom capacity, no back-to-back labs, workload balancing, and student requirements."
        ).with_model("openai", "gpt-5")
        
        prompt = f"""
Generate an optimized university timetable for the following data:

{json.dumps(timetable_data, indent=2, default=str)}

Constraints to consider:
1. No faculty should have more than {request.constraints.get('max_hours_per_day', 6)} hours per day
2. No back-to-back lab sessions for students
3. Respect classroom capacity and type (labs for lab subjects)
4. Ensure faculty expertise matches subjects
5. Balance workload across faculty
6. Consider break times and lunch breaks
7. No scheduling conflicts

Return a JSON array of timetable entries with this exact structure:
[
  {{
    "batch_id": "batch_id",
    "subject_id": "subject_id",
    "faculty_id": "faculty_id",
    "classroom_id": "classroom_id",
    "day": "monday",
    "time_slot": "09:00-10:00"
  }}
]

Ensure the response is valid JSON only, no additional text.
"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        try:
            timetable_entries = json.loads(response)
            
            # Clear existing timetable for these batches
            await db.timetable.delete_many({"batch_id": {"$in": request.batch_ids}})
            
            # Save new timetable entries
            saved_entries = []
            for entry in timetable_entries:
                timetable_entry = TimetableEntry(**entry)
                await db.timetable.insert_one(timetable_entry.dict())
                saved_entries.append(timetable_entry)
            
            return {
                "success": True,
                "message": f"Generated timetable for {len(saved_entries)} entries",
                "timetable": [entry.dict() for entry in saved_entries]
            }
            
        except json.JSONDecodeError:
            return {
                "success": False,
                "message": "Failed to parse AI response",
                "raw_response": response
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error generating timetable: {str(e)}"
        }

# Timetable Management
@api_router.get("/timetable/{batch_id}")
async def get_timetable(batch_id: str):
    timetable = await db.timetable.find({"batch_id": batch_id}).to_list(1000)
    
    # Enrich with additional data
    enriched_timetable = []
    for entry in timetable:
        # Get subject, faculty, and classroom details
        subject = await db.subjects.find_one({"id": entry["subject_id"]})
        faculty = await db.faculty.find_one({"id": entry["faculty_id"]})
        classroom = await db.classrooms.find_one({"id": entry["classroom_id"]})
        
        enriched_entry = {
            **entry,
            "subject_name": subject["name"] if subject else "Unknown",
            "subject_code": subject["code"] if subject else "Unknown",
            "faculty_name": faculty["name"] if faculty else "Unknown",
            "classroom_name": classroom["name"] if classroom else "Unknown"
        }
        enriched_timetable.append(enriched_entry)
    
    return enriched_timetable

@api_router.get("/timetable/faculty/{faculty_id}")
async def get_faculty_timetable(faculty_id: str):
    timetable = await db.timetable.find({"faculty_id": faculty_id}).to_list(1000)
    
    # Enrich with additional data
    enriched_timetable = []
    for entry in timetable:
        subject = await db.subjects.find_one({"id": entry["subject_id"]})
        classroom = await db.classrooms.find_one({"id": entry["classroom_id"]})
        batch = await db.batches.find_one({"id": entry["batch_id"]})
        
        enriched_entry = {
            **entry,
            "subject_name": subject["name"] if subject else "Unknown",
            "subject_code": subject["code"] if subject else "Unknown",
            "classroom_name": classroom["name"] if classroom else "Unknown",
            "batch_name": batch["name"] if batch else "Unknown"
        }
        enriched_timetable.append(enriched_entry)
    
    return enriched_timetable

# Announcement Management
@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(announcement: AnnouncementCreate):
    announcement_dict = announcement.dict()
    announcement_obj = Announcement(**announcement_dict)
    await db.announcements.insert_one(announcement_obj.dict())
    return announcement_obj

@api_router.get("/announcements")
async def get_announcements(role: Optional[str] = None):
    query = {}
    if role:
        query["target_roles"] = {"$in": [role]}
    
    announcements = await db.announcements.find(query).sort("timestamp", -1).to_list(100)
    return [Announcement(**a) for a in announcements]

# Absence Management
@api_router.post("/absences", response_model=Absence)
async def report_absence(absence: AbsenceCreate):
    absence_dict = absence.dict()
    absence_obj = Absence(**absence_dict)
    await db.absences.insert_one(absence_obj.dict())
    return absence_obj

@api_router.get("/absences")
async def get_absences():
    absences = await db.absences.find().sort("created_at", -1).to_list(100)
    return [Absence(**a) for a in absences]

@api_router.post("/absences/{absence_id}/substitute")
async def find_substitute(absence_id: str):
    try:
        absence = await db.absences.find_one({"id": absence_id})
        if not absence:
            raise HTTPException(status_code=404, detail="Absence not found")
        
        # Get the timetable entry for this absence
        timetable_entry = await db.timetable.find_one({
            "faculty_id": absence["lecturer_id"],
            "day": absence["date"].lower(),
            "time_slot": absence["time_slot"]
        })
        
        if not timetable_entry:
            return {"success": False, "message": "No timetable entry found for this absence"}
        
        # Get subject details
        subject = await db.subjects.find_one({"id": timetable_entry["subject_id"]})
        
        # Find qualified faculty for substitution
        qualified_faculty = await db.faculty.find({
            "subjects": {"$in": [subject["name"]]},
            "id": {"$ne": absence["lecturer_id"]}
        }).to_list(1000)
        
        # Use AI to suggest best substitute
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"substitute-{uuid.uuid4()}",
            system_message="You are an AI assistant that helps find the best substitute lecturer based on workload balance, availability, and subject expertise."
        ).with_model("openai", "gpt-5")
        
        # Get current workload for all qualified faculty
        faculty_workload = {}
        for faculty in qualified_faculty:
            workload = await db.timetable.count_documents({"faculty_id": faculty["id"]})
            faculty_workload[faculty["id"]] = workload
        
        prompt = f"""
Find the best substitute lecturer for:
Subject: {subject['name']}
Date: {absence['date']}
Time: {absence['time_slot']}

Qualified Faculty:
{json.dumps([{**f, 'current_workload': faculty_workload.get(f['id'], 0)} for f in qualified_faculty], indent=2, default=str)}

Prioritize based on:
1. Subject expertise match
2. Current availability (check for conflicts)
3. Workload balance (prefer lower workload)

Return JSON with this structure:
{{
  "recommended_faculty_id": "faculty_id",
  "reason": "explanation for selection"
}}
"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            suggestion = json.loads(response)
            
            # Update absence with suggestion
            await db.absences.update_one(
                {"id": absence_id},
                {"$set": {
                    "substitute_id": suggestion["recommended_faculty_id"],
                    "status": "substituted"
                }}
            )
            
            return {
                "success": True,
                "substitute": suggestion,
                "qualified_faculty": qualified_faculty
            }
            
        except json.JSONDecodeError:
            return {
                "success": False,
                "message": "Failed to parse AI response",
                "qualified_faculty": qualified_faculty
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error finding substitute: {str(e)}"
        }

# Dashboard Analytics
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    stats = {
        "total_faculty": await db.faculty.count_documents({}),
        "total_students": sum([batch.get("student_count", 0) for batch in await db.batches.find().to_list(1000)]),
        "total_subjects": await db.subjects.count_documents({}),
        "total_classrooms": await db.classrooms.count_documents({}),
        "total_batches": await db.batches.count_documents({}),
        "pending_absences": await db.absences.count_documents({"status": "pending"}),
        "recent_announcements": await db.announcements.count_documents({})
    }
    return stats

# Initialize sample data
@api_router.post("/init-sample-data")
async def initialize_sample_data():
    try:
        # Clear existing data
        await db.faculty.delete_many({})
        await db.subjects.delete_many({})
        await db.classrooms.delete_many({})
        await db.batches.delete_many({})
        
        # Sample Engineering Departments
        departments = ["CSE", "ISE", "ECE", "ME", "CE"]
        
        # Sample Faculty
        sample_faculty = [
            {"name": "Dr. Rajesh Kumar", "email": "rajesh@university.edu", "department": "CSE", "subjects": ["Data Structures", "Algorithms", "Programming in C"]},
            {"name": "Prof. Priya Sharma", "email": "priya@university.edu", "department": "CSE", "subjects": ["Database Systems", "Web Technologies", "Software Engineering"]},
            {"name": "Dr. Arun Patel", "email": "arun@university.edu", "department": "ECE", "subjects": ["Digital Electronics", "Microprocessors", "VLSI Design"]},
            {"name": "Prof. Meera Singh", "email": "meera@university.edu", "department": "ME", "subjects": ["Thermodynamics", "Fluid Mechanics", "Machine Design"]},
            {"name": "Dr. Suresh Reddy", "email": "suresh@university.edu", "department": "CE", "subjects": ["Structural Analysis", "Concrete Technology", "Highway Engineering"]},
            {"name": "Prof. Lakshmi Devi", "email": "lakshmi@university.edu", "department": "ISE", "subjects": ["Operations Research", "Quality Control", "Production Planning"]}
        ]
        
        for faculty_data in sample_faculty:
            faculty = Faculty(**faculty_data)
            await db.faculty.insert_one(faculty.dict())
        
        # Sample Subjects for each department and semester
        sample_subjects = {
            "CSE": {
                1: {1: ["Programming in C", "Mathematics-I", "Physics", "Engineering Graphics"],
                    2: ["Data Structures", "Mathematics-II", "Chemistry", "Workshop Practice"]},
                2: {1: ["Algorithms", "Database Systems", "Operating Systems", "Computer Networks"],
                    2: ["Software Engineering", "Web Technologies", "Machine Learning", "Compiler Design"]},
                3: {1: ["Artificial Intelligence", "Computer Graphics", "Distributed Systems", "Mobile Computing"],
                    2: ["Big Data Analytics", "Cloud Computing", "Cybersecurity", "IoT Applications"]},
                4: {1: ["Advanced Algorithms", "Deep Learning", "Blockchain Technology", "Project Work-I"],
                    2: ["Industry Internship", "Project Work-II", "Seminar", "Comprehensive Viva"]}
            },
            "ECE": {
                1: {1: ["Basic Electronics", "Mathematics-I", "Physics", "Engineering Drawing"],
                    2: ["Digital Electronics", "Mathematics-II", "Chemistry", "Electronic Circuits"]},
                2: {1: ["Microprocessors", "Signal Processing", "Communication Systems", "VLSI Design"],
                    2: ["Embedded Systems", "Antenna Theory", "RF Engineering", "Control Systems"]},
                3: {1: ["Digital Communication", "Microwave Engineering", "Power Electronics", "DSP Applications"],
                    2: ["Optical Communication", "Satellite Communication", "Biomedical Electronics", "Project-I"]},
                4: {1: ["Advanced Communication", "Nano Electronics", "Industry Training", "Project-II"],
                    2: ["Industry Internship", "Final Project", "Seminar", "Comprehensive Exam"]}
            }
        }
        
        # Add other departments with similar structure
        for dept in ["ISE", "ME", "CE"]:
            if dept not in sample_subjects:
                sample_subjects[dept] = {
                    1: {1: [f"{dept} Fundamentals", "Mathematics-I", "Physics", "Engineering Graphics"],
                        2: [f"{dept} Analysis", "Mathematics-II", "Chemistry", "Workshop Practice"]},
                    2: {1: [f"Advanced {dept}", f"{dept} Design", f"{dept} Systems", "Management"],
                        2: [f"{dept} Applications", "Quality Control", "Industrial Engineering", "Project Management"]},
                    3: {1: [f"{dept} Optimization", f"{dept} Technology", "Research Methods", "Project-I"],
                        2: [f"Modern {dept}", "Automation", "Safety Engineering", "Project-II"]},
                    4: {1: ["Industry Training", "Advanced Project", "Seminar", "Thesis-I"],
                        2: ["Final Project", "Industry Internship", "Thesis-II", "Viva Voce"]}
                }
        
        for department, years in sample_subjects.items():
            for year, semesters in years.items():
                for semester, subjects in semesters.items():
                    for subject_name in subjects:
                        subject = Subject(
                            name=subject_name,
                            code=f"{department}{year}{semester}{subjects.index(subject_name)+1:02d}",
                            department=department,
                            year=year,
                            semester=semester,
                            type="theory" if "Lab" not in subject_name else "lab",
                            hours_per_week=4 if "Lab" not in subject_name else 6
                        )
                        await db.subjects.insert_one(subject.dict())
        
        # Sample Classrooms
        sample_classrooms = [
            {"name": "LH-101", "capacity": 60, "type": "lecture_hall", "equipment": ["Projector", "Audio System"]},
            {"name": "LH-102", "capacity": 80, "type": "lecture_hall", "equipment": ["Smart Board", "AC"]},
            {"name": "LAB-201", "capacity": 30, "type": "lab", "equipment": ["Computers", "Network", "Software"]},
            {"name": "LAB-202", "capacity": 25, "type": "lab", "equipment": ["Electronics Equipment", "Oscilloscope"]},
            {"name": "SR-301", "capacity": 25, "type": "seminar_room", "equipment": ["Video Conferencing", "Whiteboard"]},
            {"name": "LH-103", "capacity": 100, "type": "lecture_hall", "equipment": ["Mic System", "Projector"]}
        ]
        
        for classroom_data in sample_classrooms:
            classroom = Classroom(**classroom_data)
            await db.classrooms.insert_one(classroom.dict())
        
        # Sample Student Batches
        sample_batches = []
        for dept in departments:
            for year in range(1, 5):
                for section in ['A', 'B']:
                    batch = StudentBatch(
                        name=f"{dept}-{year}{section}",
                        department=dept,
                        year=year,
                        semester=1 if year == 1 else 2,  # Simplified for demo
                        student_count=60
                    )
                    sample_batches.append(batch)
        
        for batch in sample_batches:
            await db.batches.insert_one(batch.dict())
        
        # Sample Announcements
        sample_announcements = [
            {"title": "Welcome to New Academic Year", "message": "Welcome all students and faculty to the new academic year 2024-25. Classes begin from Monday.", "author": "Admin", "target_roles": ["student", "lecturer"]},
            {"title": "Faculty Meeting", "message": "All faculty members are requested to attend the departmental meeting on Friday at 3 PM.", "author": "Admin", "target_roles": ["lecturer"]},
            {"title": "Exam Schedule Released", "message": "Mid-semester examination schedule has been released. Check your timetables.", "author": "Admin", "target_roles": ["student"]}
        ]
        
        for announcement_data in sample_announcements:
            announcement = Announcement(**announcement_data)
            await db.announcements.insert_one(announcement.dict())
        
        return {"success": True, "message": "Sample data initialized successfully"}
        
    except Exception as e:
        return {"success": False, "message": f"Error initializing data: {str(e)}"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
