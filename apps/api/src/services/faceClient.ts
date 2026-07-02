import axios from 'axios'

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8001'

export const faceClient = {
  async enroll(data: { personId: string; schoolId: string; image: string }) {
    const response = await axios.post(`${FACE_SERVICE_URL}/enroll`, data, { timeout: 15000 })
    return response.data
  },

  async recognize(data: { image: string; schoolId: string }) {
    const response = await axios.post(`${FACE_SERVICE_URL}/recognize`, data, { timeout: 10000 })
    return response.data
  },

  async health() {
    const response = await axios.get(`${FACE_SERVICE_URL}/health`, { timeout: 5000 })
    return response.data
  },
}
