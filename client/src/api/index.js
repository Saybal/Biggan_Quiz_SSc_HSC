
import api from './axios.js'

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
export const authAPI = {
  login:          (password)     => api.post('/auth/login',           { password }),
  changePassword: (newPassword)  => api.post('/auth/change-password', { newPassword }),
}

// ═══════════════════════════════════════════════════════════════
// SUBJECTS  (read = public, write = admin)
// ═══════════════════════════════════════════════════════════════
export const subjectsAPI = {
  getAll: ()          => api.get('/subjects'),
  create: (data)      => api.post('/admin/subjects', data),
  update: (id, data)  => api.put(`/admin/subjects/${id}`, data),
  remove: (id)        => api.delete(`/admin/subjects/${id}`),
}

// ═══════════════════════════════════════════════════════════════
// LEVELS
// ═══════════════════════════════════════════════════════════════
export const levelsAPI = {
  getAll: ()          => api.get('/levels'),
  create: (data)      => api.post('/admin/levels', data),
  update: (id, data)  => api.put(`/admin/levels/${id}`, data),
  remove: (id)        => api.delete(`/admin/levels/${id}`),
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONS
// ═══════════════════════════════════════════════════════════════
export const questionsAPI = {
  getAll:    (params)            => api.get('/questions', { params }),  // ?subjectId=&levelId=
  /** Admin: includes unpublished / scheduled exam questions */
  browse:    (params)            => api.get('/admin/questions/browse', { params }),
  create:    (data)              => api.post('/admin/questions', data),
  update:    (id, data)          => api.put(`/admin/questions/${id}`, data),
  remove:    (id)                => api.delete(`/admin/questions/${id}`),
  bulkCreate:(subjectId, levelId, questions) =>
                                    api.post('/admin/questions/bulk', { subjectId, levelId, questions }),
  export:    (params)            => api.get('/admin/questions/export', { params }),
  collectionList: (params)       => api.get('/admin/collection/questions', { params }),
  collectionPatch: (id, data)    => api.patch(`/admin/collection/questions/${id}`, data),
}

// ═══════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════
// export const resultsAPI = {
//   save:        (data)   => api.post('/results', data),
//   leaderboard: (params) => api.get('/results/leaderboard', { params }),
//   getAll:      (params) => api.get('/admin/results', { params }),
//   clearAll:    ()       => api.delete('/admin/results'),
// }
export const resultsAPI = {
  save:        (data)   => api.post('/results', data),
  leaderboard: (params) => api.get('/results/leaderboard', { params }),
  getAll:      (params) => api.get('/admin/results', { params }),
  getDetail:   (id)     => api.get(`/admin/results/${id}/detail`),
  clearAll:    ()       => api.delete('/admin/results'),
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS  [admin]
// ═══════════════════════════════════════════════════════════════
export const settingsAPI = {
  get:    ()      => api.get('/admin/settings'),
  update: (data)  => api.patch('/admin/settings', data),
}

// ═══════════════════════════════════════════════════════════════
// EXAMS (student + admin)
// ═══════════════════════════════════════════════════════════════
export const examsAPI = {
  // Student list: GET /api/exams?subjectId=
  list:     (params)   => api.get('/exams', { params }),
  getExam:  (examId)   => api.get(`/exams/${examId}`),
  // Teacher/admin question fetch: GET /api/exams/:examId/questions
  getQuestions: (examId) => api.get(`/exams/${examId}/questions`),
  // In examsAPI, add:
// getQuestions: (examId) => api.get(`/exams/${examId}/questions`),

  // Auth required:
  submitAttempt: (data) => api.post('/exams/attempts', data),
  attemptStatus: (examId) => api.get(`/exams/${examId}/attempt-status`),
  myExamMerit:   (examId) => api.get(`/exams/${examId}/merit`),
  overallMerit:  ()       => api.get('/merit/overall'),
}

// ═══════════════════════════════════════════════════════════════
// PDF PARSE  [admin]
// ═══════════════════════════════════════════════════════════════
export const pdfAPI = {
  /**
   * Upload a PDF file and get extracted questions back.
   * @param {File} file  - the PDF File object from <input type="file">
   */
  parse: (file) => {
    const form = new FormData()
    form.append('pdf', file)
    return api.post('/admin/pdf/parse', form, {
      headers:  { 'Content-Type': 'multipart/form-data' },
      timeout:  60000,  // PDF + AI can be slow
    })
  },
}

// Admin: create exam + store its questions
export const adminExamsAPI = {
  list:   (params) => api.get('/admin/exams', { params }),
  create: (data)   => api.post('/admin/exams', data),
  patch:  (examId, data) => api.patch(`/admin/exams/${examId}`, data),
}
