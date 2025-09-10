import api from './client'

export async function login(username, password) {
  const { data } = await api.post('/auth/token/', { username, password })
  localStorage.setItem('token', data.access)
  return data
}

export async function me() {
  const { data } = await api.get('/me/')
  return data
}
