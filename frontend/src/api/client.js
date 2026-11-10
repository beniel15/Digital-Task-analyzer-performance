const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return sessionStorage.getItem('mm_auth_token');
  }

  setToken(token) {
    if (token) {
      sessionStorage.setItem('mm_auth_token', token);
    } else {
      sessionStorage.removeItem('mm_auth_token');
    }
  }

  getUser() {
    const raw = sessionStorage.getItem('mm_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  setUser(user) {
    if (user) {
      sessionStorage.setItem('mm_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('mm_user');
    }
  }

  clearSession() {
    sessionStorage.removeItem('mm_auth_token');
    sessionStorage.removeItem('mm_user');
    sessionStorage.removeItem('userRole');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        // Token expired or invalid
        this.clearSession();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error(data?.error || 'Session expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Auth methods
  login(identifier, password, role) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role })
    });
  }

  getCurrentUser() {
    return this.request('/api/auth/me');
  }

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' }).finally(() => {
      this.clearSession();
    });
  }

  // Student methods
  getStudentProfile() {
    return this.request('/api/student/profile');
  }

  updateStudentProfile(data) {
    return this.request('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  updateStudentDetails(data) {
    return this.request('/api/student/update-details', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  submitUpdate(data) {
    return this.request('/api/student/update-details', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getStudentSubmissions() {
    return this.request('/api/student/submissions');
  }

  getStudentRewardPoints() {
    return this.request('/api/student/reward-points');
  }

  getStudentAttendance() {
    return this.request('/api/student/attendance');
  }

  getCollegeActivities() {
    return this.request('/api/student/activities');
  }

  updateActivityStatus(activityId, status) {
    return this.request(`/api/student/activities/${activityId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  getStudentAnalytics() {
    return this.request('/api/student/analytics');
  }

  getStudentFeedback() {
    return this.request('/api/student/feedback');
  }

  getStudentNotifications() {
    return this.request('/api/student/notifications');
  }

  markStudentNotificationRead(id) {
    return this.request(`/api/student/notifications/${id}/read`, { method: 'PUT' });
  }

  // Mentor methods
  getAssignedMentees() {
    return this.request('/api/mentor/mentees');
  }

  getMenteeDetails(studentId) {
    return this.request(`/api/mentor/mentees/${studentId}`);
  }

  getMentorSubmissions() {
    return this.request('/api/mentor/submissions');
  }

  reviewSubmission(id, action, rejection_reason = '') {
    return this.request(`/api/mentor/submissions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, rejection_reason })
    });
  }

  provideFeedback(studentId, category, message) {
    const payload = (studentId === 'all' || !studentId)
      ? { send_to_all: true, category, message }
      : { student_id: studentId, category, message };
    return this.request('/api/mentor/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  sendGeneralBroadcast(message, category = 'General') {
    return this.request('/api/mentor/feedback', {
      method: 'POST',
      body: JSON.stringify({ send_to_all: true, category, message })
    });
  }

  getMentorAllFeedback() {
    return this.request('/api/mentor/feedback');
  }

  getFeedbackHistory(studentId) {
    return this.request(`/api/mentor/feedback/${studentId}`);
  }

  getMentorAnalytics() {
    return this.request('/api/mentor/analytics');
  }

  getMentorNotifications() {
    return this.request('/api/mentor/notifications');
  }

  markMentorNotificationRead(id) {
    return this.request(`/api/mentor/notifications/${id}/read`, { method: 'PUT' });
  }
}

export const api = new ApiClient();
export default api;

