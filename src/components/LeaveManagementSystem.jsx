import React, { useEffect, useState } from 'react';
import { Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

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
  const [notification, setNotification] = useState(null);

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

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

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

  const sortByAppliedDesc = (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt);

  const handleSignup = () => {
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      triggerNotification('error', 'Please complete all signup fields before continuing.');
      return;
    }

    const existingUser = users.find(u => u.email === signupForm.email);
    if (existingUser) {
      triggerNotification('error', 'This email is already registered. Please login instead.');
      return;
    }

    const newUser = {
      id: Date.now(),
      ...signupForm,
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    triggerNotification('success', 'Signup successful! Please login with your new account.');
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
      triggerNotification('error', 'Please enter both email and password to sign in.');
      return;
    }

    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setActiveTab('dashboard');
      setLoginForm({ email: '', password: '' });
      triggerNotification('success', `Welcome back, ${user.name}!`);
    } else {
      triggerNotification('error', 'Invalid credentials. Check your email and password.');
    }
  };

  const handleLeaveApplication = () => {
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) {
      triggerNotification('error', 'Please complete all leave details before submitting.');
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
      triggerNotification('error', 'Leave rejected automatically because of an overlapping academic event.');
    } else {
      triggerNotification('success', 'Leave application submitted successfully. Await advisor response.');
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
    triggerNotification(approved ? 'success' : 'error', approved ? 'Leave forwarded to the HOD for final approval.' : 'Leave rejected and the applicant has been notified.');
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
    triggerNotification(approved ? 'success' : 'error', approved ? 'Leave request fully approved.' : 'Leave rejected at HOD level.');
  };

  const handleCreateEvent = () => {
    if (!eventForm.name || !eventForm.fromDate || !eventForm.toDate) {
      triggerNotification('error', 'Event name and dates are required to schedule an academic event.');
      return;
    }

    const newEvent = {
      id: Date.now(),
      ...eventForm,
      createdBy: currentUser.name,
      department: currentUser.department
    };
    setAcademicEvents([...academicEvents, newEvent]);
    triggerNotification('success', 'Academic event created successfully!');
    setEventForm({
      name: '',
      fromDate: '',
      toDate: ''
    });
  };

  const getVisibleLeaves = () => {
    if (!currentUser) return [];

    if (currentUser.role === 'student') {
      return leaves
        .filter(leave => leave.userId === currentUser.id)
        .sort(sortByAppliedDesc);
    }
    if (currentUser.role === 'advisor') {
      return leaves
        .filter(leave =>
          leave.department === currentUser.department &&
          leave.section === currentUser.section &&
          (leave.status === 'pending' || leave.advisorApproval !== null)
        )
        .sort(sortByAppliedDesc);
    }
    if (currentUser.role === 'hod') {
      return leaves
        .filter(leave =>
          leave.department === currentUser.department &&
          (leave.status === 'forwarded_to_hod' || leave.hodApproval !== null)
        )
        .sort(sortByAppliedDesc);
    }
    return [];
  };

  const getLatestLeave = () => {
    const visible = getVisibleLeaves();
    return visible.length > 0 ? visible[0] : null;
  };

  const getLeaveHistory = () => {
    const visible = getVisibleLeaves();
    return visible.slice(1);
  };

  const renderLeaveActions = (leave) => {
    if (currentUser.role === 'advisor' && leave.status === 'pending') {
      return (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={() => handleAdvisorApproval(leave.id, true)}
            className="approve-btn"
          >
            <CheckCircle size={16} /> Approve
          </button>
          <button
            onClick={() => handleAdvisorApproval(leave.id, false)}
            className="reject-btn"
          >
            <XCircle size={16} /> Reject
          </button>
        </div>
      );
    }
    if (currentUser.role === 'hod' && leave.status === 'forwarded_to_hod') {
      return (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={() => handleHodApproval(leave.id, true)}
            className="approve-btn"
          >
            <CheckCircle size={16} /> Approve
          </button>
          <button
            onClick={() => handleHodApproval(leave.id, false)}
            className="reject-btn"
          >
            <XCircle size={16} /> Reject
          </button>
        </div>
      );
    }
    return null;
  };

  const renderLatestLeave = () => {
    const latest = getLatestLeave();
    if (!latest) return null;

    const appliedOn = new Date(latest.appliedAt).toLocaleString();
    const contextTitle = currentUser.role === 'student'
      ? 'Your most recent leave application'
      : currentUser.role === 'advisor'
        ? 'Latest leave awaiting your attention'
        : 'Latest leave awaiting HOD review';

    return (
      <div className="glass-card p-8 space-y-5">
        <div className="flex items-center gap-3">
          <Clock size={28} className="text-indigo-500" />
          <div>
            <h3 className="text-xl font-semibold text-slate-800">{contextTitle}</h3>
            <p className="text-sm text-slate-500">Submitted on {appliedOn}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white/95 p-5 shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-lg">{latest.userName}</h4>
              <p className="text-sm text-slate-500">
                {latest.department} - Section {latest.section}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(latest.status)}`}>
              {latest.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Type:</span>{' '}
              <span className="font-medium text-slate-700">{latest.type}</span>
            </div>
            <div>
              <span className="text-slate-500">Period:</span>{' '}
              <span className="font-medium text-slate-700">{latest.fromDate} → {latest.toDate}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Reason:</span> {latest.reason}
          </p>
          {latest.rejectionReason && (
            <p className="text-sm text-rose-600">
              <span className="font-semibold">Rejection Reason:</span> {latest.rejectionReason}
            </p>
          )}
          {renderLeaveActions(latest)}
        </div>
      </div>
    );
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

  const triggerNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  const clearNotification = () => setNotification(null);

  const renderNotification = () => {
    if (!notification) return null;

    const variants = {
      success: {
        className: 'notification-banner notification-success',
        icon: <CheckCircle size={18} className="text-emerald-600" />,
        title: 'Success'
      },
      error: {
        className: 'notification-banner notification-error',
        icon: <AlertCircle size={18} className="text-rose-600" />,
        title: 'Attention'
      },
      info: {
        className: 'notification-banner notification-info',
        icon: <Info size={18} className="text-indigo-600" />,
        title: 'Heads up'
      }
    };

    const variant = variants[notification.type] || variants.info;

    return (
      <div className="max-w-3xl mx-auto">
        <div className={`${variant.className}`}>
          <span className="notification-icon">
            {variant.icon}
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{variant.title}</p>
            <p className="text-sm leading-relaxed">{notification.message}</p>
          </div>
          <button
            type="button"
            className="notification-dismiss"
            onClick={clearNotification}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderSignup = () => (
    <div className="max-w-lg mx-auto glass-card p-10">
      <div className="text-center mb-8 space-y-2">
        <span className="inline-flex items-center gap-2 text-indigo-500 font-semibold uppercase tracking-wide text-xs">
          <FileText size={16} /> Create Account
        </span>
        <h2 className="text-3xl font-bold text-slate-800">Get started with a new profile</h2>
        <p className="text-slate-500 text-sm">
          Register as a student, advisor, or HOD to manage leave approvals seamlessly.
        </p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="form-label">Name</label>
          <input
            type="text"
            value={signupForm.name}
            onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
            className="form-field"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            value={signupForm.email}
            onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
            className="form-field"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="form-label">Password</label>
          <input
            type="password"
            value={signupForm.password}
            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
            className="form-field"
            placeholder="Enter password"
          />
        </div>
        <div>
          <label className="form-label">Department</label>
          <select
            value={signupForm.department}
            onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
            className="form-field"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Role</label>
          <select
            value={signupForm.role}
            onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
            className="form-field"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role.toUpperCase()}</option>
            ))}
          </select>
        </div>
        {signupForm.role !== 'hod' && (
          <div>
            <label className="form-label">Section</label>
            <select
              value={signupForm.section}
              onChange={(e) => setSignupForm({ ...signupForm, section: e.target.value })}
              className="form-field"
            >
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleSignup}
          className="w-full primary-btn"
        >
          Sign Up
        </button>
        <button
          onClick={() => setActiveTab('login')}
          className="w-full text-btn"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="max-w-lg mx-auto glass-card p-10">
      <div className="text-center mb-8 space-y-2">
        <span className="inline-flex items-center gap-2 text-indigo-500 font-semibold uppercase tracking-wide text-xs">
          <Calendar size={16} /> Welcome Back
        </span>
        <h2 className="text-3xl font-bold text-slate-800">Access your dashboard</h2>
        <p className="text-slate-500 text-sm">
          Log in to manage leave applications, approvals, and academic events with ease.
        </p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            className="form-field"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="form-label">Password</label>
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="form-field"
            placeholder="Enter password"
          />
        </div>
        <button
          onClick={handleLogin}
          className="w-full primary-btn"
        >
          Login
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className="w-full text-btn"
        >
          Don't have an account? Sign Up
        </button>
      </div>
    </div>
  );

  const renderLeaveApplication = () => (
    <div className="glass-card p-8 space-y-6">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-slate-800">Apply for Leave</h3>
        <p className="text-slate-500 text-sm">Submit your leave request with details for faster approvals.</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="form-label">Leave Type</label>
          <select
            value={leaveForm.type}
            onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
            className="form-field"
          >
            {leaveTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={leaveForm.fromDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
              className="form-field"
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={leaveForm.toDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
              className="form-field"
            />
          </div>
        </div>
        <div>
          <label className="form-label">Reason</label>
          <textarea
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            rows="4"
            className="form-field"
            placeholder="Enter reason for leave"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleLeaveApplication}
            className="flex-1 primary-btn"
          >
            Submit Application
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex-1 secondary-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderLeavesList = () => {
    const historyLeaves = getLeaveHistory();

    return (
      <div className="glass-card p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-slate-800">Leave History</h3>
          <p className="text-slate-500 text-sm">
            Review previous leave records. The most recent application is highlighted on the dashboard.
          </p>
        </div>
        {historyLeaves.length === 0 ? (
          <p className="text-slate-500 text-center py-10 border border-dashed border-slate-300 rounded-2xl bg-white/70">
            No earlier leave history found.
          </p>
        ) : (
          <div className="space-y-4">
            {historyLeaves.map(leave => (
              <div
                key={leave.id}
                className="rounded-2xl border border-white/60 bg-white/80 shadow-sm hover:shadow-lg transition-all duration-200 p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-800 text-lg">{leave.userName}</h4>
                    <p className="text-sm text-slate-500">
                      {leave.department} - Section {leave.section}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                    {leave.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-slate-500">Type:</span> <span className="font-medium text-slate-700">{leave.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">From:</span> <span className="font-medium text-slate-700">{leave.fromDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">To:</span> <span className="font-medium text-slate-700">{leave.toDate}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-semibold text-slate-700">Reason:</span> {leave.reason}
                </p>
                {leave.rejectionReason && (
                  <p className="text-sm text-rose-600 mb-2">
                    <span className="font-medium">Rejection Reason:</span> {leave.rejectionReason}
                  </p>
                )}
                {renderLeaveActions(leave)}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="secondary-btn"
        >
          Back to Dashboard
        </button>
      </div>
    );
  };

  const renderAcademicEvents = () => (
    <div className="glass-card p-8 space-y-6">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-slate-800">Academic Events</h3>
        <p className="text-slate-500 text-sm">Plan, publish, and track upcoming academic activities.</p>
      </div>

      <div className="space-y-5 pb-6 border-b border-white/60">
        <h4 className="font-semibold text-slate-700">Create New Event</h4>
        <div>
          <label className="form-label">Event Name</label>
          <input
            type="text"
            value={eventForm.name}
            onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
            className="form-field"
            placeholder="Enter event name"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={eventForm.fromDate}
              onChange={(e) => setEventForm({ ...eventForm, fromDate: e.target.value })}
              className="form-field"
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={eventForm.toDate}
              onChange={(e) => setEventForm({ ...eventForm, toDate: e.target.value })}
              className="form-field"
            />
          </div>
        </div>
        <button
          onClick={handleCreateEvent}
          className="w-full primary-btn"
        >
          Create Event
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-slate-700">Scheduled Events</h4>
        {academicEvents.filter(e => e.department === currentUser.department).length === 0 ? (
          <p className="text-slate-500 text-center py-6 border border-dashed border-slate-300 rounded-2xl bg-white/70">
            No events scheduled
          </p>
        ) : (
          <div className="space-y-3">
            {academicEvents.filter(e => e.department === currentUser.department).map(event => (
              <div key={event.id} className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-sm hover:shadow-lg transition-all duration-200">
                <h5 className="font-semibold text-slate-800">{event.name}</h5>
                <p className="text-sm text-slate-500">
                  {event.fromDate} to {event.toDate}
                </p>
                <p className="text-xs text-slate-400 mt-1">Created by: {event.createdBy}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setActiveTab('dashboard')}
        className="secondary-btn"
      >
        Back to Dashboard
      </button>
    </div>
  );

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="glass-card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-800">Welcome, {currentUser.name}</h2>
          <p className="text-slate-500">
            {currentUser.role.toUpperCase()} | {currentUser.department}
            {currentUser.role !== 'hod' && currentUser.section && ` - Section ${currentUser.section}`}
          </p>
          <p className="text-sm text-slate-400">
            Manage applications, approvals, and schedules from a single control center.
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentUser(null);
            setActiveTab('login');
          }}
          className="secondary-btn"
        >
          Logout
        </button>
      </div>

      {renderLatestLeave()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentUser.role === 'student' && (
          <button
            onClick={() => setActiveTab('apply-leave')}
            className="icon-card"
          >
            <FileText className="mx-auto mb-2" size={32} />
            <div className="font-semibold">Apply for Leave</div>
          </button>
        )}
        <button
          onClick={() => setActiveTab('view-leaves')}
          className="icon-card from-emerald-500 to-emerald-600"
        >
          <Clock className="mx-auto mb-2" size={32} />
          <div className="font-semibold">View Leaves</div>
        </button>
        {currentUser.role === 'advisor' && (
          <button
            onClick={() => setActiveTab('academic-events')}
            className="icon-card from-purple-500 to-purple-600"
          >
            <Calendar className="mx-auto mb-2" size={32} />
            <div className="font-semibold">Academic Events</div>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {activeTab === 'apply-leave' && renderLeaveApplication()}
        {activeTab === 'view-leaves' && renderLeavesList()}
        {activeTab === 'academic-events' && renderAcademicEvents()}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {renderNotification()}

        <div className="text-center space-y-3 text-white/90">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Leave Management System</h1>
          <p className="text-base md:text-lg text-white/80">
            Streamlined leave application, approval workflows, and academic scheduling.
          </p>
        </div>

        {!currentUser && activeTab === 'signup' && renderSignup()}
        {!currentUser && activeTab === 'login' && renderLogin()}
        {currentUser && renderDashboard()}
      </div>
    </div>
  );
};

export default LeaveManagementSystem;
