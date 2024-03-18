import { LoginPayload, UserData } from '../type/types';

const ROOT_URL = 'https://dev-expenses-api.pantheonsite.io';

export async function loginUser(dispatch: any, loginPayload: LoginPayload) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginPayload),
  };

  try {
    dispatch({ type: 'REQUEST_LOGIN' });
    const response = await fetch(
      `${ROOT_URL}/user/login/google?_format=json`,
      requestOptions
    );
    const data: UserData = await response.json();

    if (data.current_user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      localStorage.setItem('currentUser', JSON.stringify(data));
      return data;
    }

    dispatch({ type: 'LOGIN_ERROR', error: data.errors[0] });
  } catch (error) {
    dispatch({ type: 'LOGIN_ERROR', error: error });
  }
}

export async function logout(dispatch: any, dataDispatch: any) {
  await dispatch({ type: 'LOGOUT' });
  await dataDispatch({ type: 'REMOVE_DATA' });
  await localStorage.removeItem('currentUser');
  await localStorage.removeItem('token');
}
