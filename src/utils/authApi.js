const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    return {
      ok: false,
      message: `Cannot reach backend at ${API_BASE_URL}. Make sure the server is running.`,
      status: 0,
      data: null
    };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      message: payload?.message || `Request failed with status ${response.status}.`,
      status: response.status,
      data: payload
    };
  }

  return { ok: true, data: payload };
}

export async function signUpRequest(name, email, password) {
  const result = await apiRequest('/auth/signup', {
    method: 'POST',
    body: { name, email, password }
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return {
    ok: true,
    message: result.data?.message || 'Account created successfully.',
    user: result.data?.user,
    accessToken: result.data?.accessToken,
    refreshToken: result.data?.refreshToken
  };
}

export async function signInRequest(email, password) {
  const result = await apiRequest('/auth/signin', {
    method: 'POST',
    body: { email, password }
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return {
    ok: true,
    message: result.data?.message || 'Signed in successfully.',
    user: result.data?.user,
    accessToken: result.data?.accessToken,
    refreshToken: result.data?.refreshToken
  };
}

export async function getCurrentUser(accessToken) {
  if (!accessToken) {
    return { ok: false, message: 'Missing access token.' };
  }

  const result = await apiRequest('/users/me', { token: accessToken });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, user: result.data };
}

export async function signOutRequest(refreshToken) {
  if (!refreshToken) {
    return { ok: true };
  }

  const result = await apiRequest('/auth/signout', {
    method: 'POST',
    body: { refreshToken }
  });

  return { ok: result.ok };
}

export async function updateAccountRequest(accessToken, payload) {
  const result = await apiRequest('/users/me', {
    method: 'PATCH',
    token: accessToken,
    body: payload
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return {
    ok: true,
    message: result.data?.message || 'Account updated successfully.',
    user: result.data?.user,
    accessToken: result.data?.accessToken,
    refreshToken: result.data?.refreshToken
  };
}

export async function deleteAccountRequest(accessToken) {
  const result = await apiRequest('/users/me', {
    method: 'DELETE',
    token: accessToken
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, message: 'Account deleted successfully.' };
}

export async function bootstrapAdminRequest(accessToken) {
  const result = await apiRequest('/users/bootstrap-admin', {
    method: 'POST',
    token: accessToken
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return {
    ok: true,
    message: result.data?.message || 'Admin account bootstrapped successfully.',
    user: result.data?.user
  };
}
