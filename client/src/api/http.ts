import Cookies from 'js-cookie';

const fetchInterceptor = (url: string, options: any) => {
  const newOptions = { ...options };
  newOptions.headers = {
    ...newOptions.headers,
    Authorization: `Bearer ${Cookies.get('token')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  return fetch(url, newOptions);
};

export const modifiedFetch = async (url: string, options: any) => {
  return fetchInterceptor(url, options)
    .then((response: any) => {
      if (!response.ok) {
        throw new Error(response.error);
      }
      return response;
    })
    .catch(error => {
      throw error;
    });
};