import React, { useEffect, useState } from 'react';
import { Calendar, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

const LeaveManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem('lms_users');
    return stored ? JSON.parse(stored) : [];
  });
  const [leaves, setLeaves] = useState(() => {
    const stored = localStorage.getItem('lms_leaves');
    return stored ? JSON.parse(stored) : [];
  });
  const [academicEvents, setAcademicEvents] = useState(() => {
    const stored = localStorage.getItem('lms_events');
    return stored ? JSON.parse(stored) : [];
  });
  const [activeTab, setActiveTab] = useState('login');

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    department: 'CSE',
    role: 'student',
    section: 'A',
    password: ''
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [leaveForm, setLeaveForm] = useState({
    type: 'sick',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const [eventForm, setEventForm] = useState({
    name: '',
    fromDate: '',
    toDate: ''
  });

  const departments = ['CSE', 'AIML', 'AIDS', 'ECE', 'IT', 'EEE', 'MECH', 'CSBS', 'CCE'];
  const roles = ['student', 'advisor', 'hod'];
  const sections = ['A', 'B', 'C', 'D'];
  const leaveTypes = ['sick', 'personal', 'emergency', 'other'];

  useEffect(() => {
    localStorage.setItem('lms_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('lms_leaves', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('lms_events', JSON.stringify(academicEvents));
  }, [academicEvents]);

  const checkAcademicEventConflict = (fromDate, toDate, leaveType) => {
    if (leaveType === 'sick') return false;

    const from = new Date(fromDate);
    const to = new Date(toDate);

    return academicEvents.some(event => {
      const eventFrom = new Date(event.fromDate);
      const eventTo = new Date(event.toDate);
      return from <= eventTo && to >= eventFrom;
    });
  };

  const handleSignup = () => {
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      alert('Please fill in all fields!');
      return;
    }

    const existingUser = users.find(u => u.email === signupForm.email);
    if (existingUser) {
      alert('Email already registered!');
      return;
    }

    const newUser = {
      id: Date.now(),
      ...signupForm,
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    alert('Signup successful! Please login.');
    setActiveTab('login');
    setSignupForm({
      name: '',
      email: '',
      department: 'CSE',
      role: 'student',
      section: 'A',
      password: ''
    });
  };

  const handleLogin = () => {
    if (!loginForm.email || !loginForm.password) {
      alert('Please enter email and password!');
      return;
    }

    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setActiveTab('dashboard');
      setLoginForm({ email: '', password: '' });
    } else {
      alert('Invalid credentials!');
    }
  };

  const handleLeaveApplication = () => {
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) {
      alert('Please fill in all fields!');
      return;
    }

    const hasConflict = checkAcademicEventConflict(leaveForm.fromDate, leaveForm.toDate, leaveForm.type);

    const newLeave = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      department: currentUser.department,
      section: currentUser.section,
      ...leaveForm,
      status: hasConflict ? 'rejected' : 'pending',
      rejectionReason: hasConflict ? 'Academic event scheduled during this period' : null,
      advisorApproval: null,
      hodApproval: null,
      appliedAt: new Date().toISOString()
    };

    setLeaves([...leaves, newLeave]);

    if (hasConflict) {
      alert('Leave application rejected: Academic event scheduled during this period');
    } else {
      alert('Leave application submitted successfully!');
    }

    setLeaveForm({
      type: 'sick',
      fromDate: '',
      toDate: '',
      reason: ''
    });
  };

  const handleAdvisorApproval = (leaveId, approved) => {
    setLeaves(leaves.map(leave => {
      if (leave.id === leaveId) {
        return {
          ...leave,
          advisorApproval: approved,
          status: approved ? 'forwarded_to_hod' : 'rejected',
          rejectionReason: !approved ? 'Rejected by advisor' : null
        };
      }
      return leave;
    }));
    alert(approved ? 'Leave forwarded to HOD' : 'Leave rejected');
  };

  const handleHodApproval = (leaveId, approved) => {
    setLeaves(leaves.map(leave => {
      if (leave.id === leaveId) {
        return {
          ...leave,
          hodApproval: approved,
          status: approved ? 'approved' : 'rejected',
          rejectionReason: !approved ? 'Rejected by HOD' : null
        };
      }
      return leave;
    }));
    alert(approved ? 'Leave approved' : 'Leave rejected');
  };

  const handleCreateEvent = () => {
    if (!eventForm.name || !eventForm.fromDate || !eventForm.toDate) {
      alert('Please fill in all fields!');
      return;
    }

    const newEvent = {
      id: Date.now(),
      ...eventForm,
      createdBy: currentUser.name,
      department: currentUser.department
    };
    setAcademicEvents([...academicEvents, newEvent]);
    alert('Academic event created successfully!');
    setEventForm({
      name: '',
      fromDate: '',
      toDate: ''
    });
  };

  const getVisibleLeaves = () => {
    if (!currentUser) return [];

    if (currentUser.role === 'student') {
      return leaves.filter(leave => leave.userId === currentUser.id);
    }
    if (currentUser.role === 'advisor') {
      return leaves.filter(leave =>
        leave.department === currentUser.department &&
        leave.section === currentUser.section &&
        (leave.status === 'pending' || leave.advisorApproval !== null)
      );
    }
    if (currentUser.role === 'hod') {
      return leaves.filter(leave =>
        leave.department === currentUser.department &&
        (leave.status === 'forwarded_to_hod' || leave.hodApproval !== null)
      );
    }
    return [];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'forwarded_to_hod':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderSignup = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign Up</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={signupForm.name}
            onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={signupForm.email}
            onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={signupForm.password}
            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={signupForm.department}
            onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={signupForm.role}
            onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role.toUpperCase()}</option>
            ))}
          </select>
        </div>
        {signupForm.role !== 'hod' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={signupForm.section}
              onChange={(e) => setSignupForm({ ...signupForm, section: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Sign Up
        </button>
        <button
          onClick={() => setActiveTab('login')}
          className="w-full text-blue-600 py-2 hover:underline"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter password"
          />
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Login
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className="w-full text-blue-600 py-2 hover:underline"
        >
          Don't have an account? Sign Up
        </button>
      </div>
    </div>
  );

  const renderLeaveApplication = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Apply for Leave</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
          <select
            value={leaveForm.type}
            onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {leaveTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={leaveForm.fromDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={leaveForm.toDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter reason for leave"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleLeaveApplication}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Submit Application
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderLeavesList = () => {
    const visibleLeaves = getVisibleLeaves();

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Leave Applications</h3>
        {visibleLeaves.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No leave applications found</p>
        ) : (
          <div className="space-y-4">
            {visibleLeaves.map(leave => (
              <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{leave.userName}</h4>
                    <p className="text-sm text-gray-600">
                      {leave.department} - Section {leave.section}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                    {leave.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-gray-600">Type:</span> <span className="font-medium">{leave.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">From:</span> <span className="font-medium">{leave.fromDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">To:</span> <span className="font-medium">{leave.toDate}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Reason:</span> {leave.reason}
                </p>
                {leave.rejectionReason && (
                  <p className="text-sm text-red-600 mb-2">
                    <span className="font-medium">Rejection Reason:</span> {leave.rejectionReason}
                  </p>
                )}

                {currentUser.role === 'advisor' && leave.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAdvisorApproval(leave.id, true)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleAdvisorApproval(leave.id, false)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}

                {currentUser.role === 'hod' && leave.status === 'forwarded_to_hod' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleHodApproval(leave.id, true)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleHodApproval(leave.id, false)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  };

  const renderAcademicEvents = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Academic Events</h3>

      <div className="space-y-4 mb-6 pb-6 border-b">
        <h4 className="font-semibold text-gray-700">Create New Event</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
          <input
            type="text"
            value={eventForm.name}
            onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter event name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={eventForm.fromDate}
              onChange={(e) => setEventForm({ ...eventForm, fromDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={eventForm.toDate}
              onChange={(e) => setEventForm({ ...eventForm, toDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleCreateEvent}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
        >
          Create Event
        </button>
      </div>

      <h4 className="font-semibold text-gray-700 mb-3">Scheduled Events</h4>
      {academicEvents.filter(e => e.department === currentUser.department).length === 0 ? (
        <p className="text-gray-600 text-center py-4">No events scheduled</p>
      ) : (
        <div className="space-y-3">
          {academicEvents.filter(e => e.department === currentUser.department).map(event => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800">{event.name}</h5>
              <p className="text-sm text-gray-600">
                {event.fromDate} to {event.toDate}
              </p>
              <p className="text-xs text-gray-500 mt-1">Created by: {event.createdBy}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setActiveTab('dashboard')}
        className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
      >
        Back to Dashboard
      </button>
    </div>
  );

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {currentUser.name}</h2>
            <p className="text-gray-600">
              {currentUser.role.toUpperCase()} | {currentUser.department}
              {currentUser.role !== 'hod' && currentUser.section && ` - Section ${currentUser.section}`}
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentUser(null);
              setActiveTab('login');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {currentUser.role === 'student' && (
          <button
            onClick={() => setActiveTab('apply-leave')}
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="mx-auto mb-2" size={32} />
            <div className="font-semibold">Apply for Leave</div>
          </button>
        )}
        <button
          onClick={() => setActiveTab('view-leaves')}
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Clock className="mx-auto mb-2" size={32} />
          <div className="font-semibold">View Leaves</div>
        </button>
        {currentUser.role === 'advisor' && (
          <button
            onClick={() => setActiveTab('academic-events')}
            className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Calendar className="mx-auto mb-2" size={32} />
            <div className="font-semibold">Academic Events</div>
          </button>
        )}
      </div>

      {activeTab === 'apply-leave' && renderLeaveApplication()}
      {activeTab === 'view-leaves' && renderLeavesList()}
      {activeTab === 'academic-events' && renderAcademicEvents()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Leave Management System</h1>
          <p className="text-gray-600">Streamlined leave application and approval workflow</p>
        </div>

        {!currentUser && activeTab === 'signup' && renderSignup()}
        {!currentUser && activeTab === 'login' && renderLogin()}
        {currentUser && renderDashboard()}
      </div>
    </div>
  );
};

export default LeaveManagementSystem;
